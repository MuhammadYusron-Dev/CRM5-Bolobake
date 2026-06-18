import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID, getAdmins } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { writeAuditLogServer } from '@/lib/audit';
import { EventType, OrderStage, OrderState, LifecycleEvent, Role } from '@/lib/types';
import crypto from 'crypto';
import { SLA_CONFIG } from '@/lib/config/sla';
import { roleCache, eventLock, allowedTransitions } from '@/lib/lifecycle-hardening';
import { invalidateCache } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (!payload.email && !payload.username)) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const emailOrUser = (payload.email || payload.username) as string;
    const userId = emailOrUser.toLowerCase();
    const nowTime = Date.now();

    // 1. ROLE REVALIDATION OPTIMIZATION (CACHE LAYER)
    let role: Role = 'ADMIN';
    let userName = emailOrUser;

    if (roleCache[userId] && roleCache[userId].expiresAt > nowTime) {
      role = roleCache[userId].role as Role;
      userName = roleCache[userId].name || userName;
    } else {
      const admins = await getAdmins();
      const admin = admins.find(a => a.email?.toLowerCase() === userId || a.username?.toLowerCase() === userId);

      if (!admin) {
        return NextResponse.json({ success: false, error: 'User not found in system' }, { status: 403 });
      }

      role = (admin.role || 'ADMIN') as Role;
      userName = admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : emailOrUser;

      // Update cache
      roleCache[userId] = {
        role: role,
        name: userName,
        expiresAt: nowTime + 60000 // 60 seconds TTL
      };
    }

    const body = await request.json();
    const { rowNumber, orderId, action, targetStage, notes, attachments, assignedTo, assignedToId, department, reason } = body;

    if (!rowNumber) {
      return NextResponse.json({ success: false, error: 'rowNumber is required' }, { status: 400 });
    }

    // 2. EVENT ATOMICITY LOCK SYSTEM
    const lockKey = String(orderId || rowNumber);
    const lock = eventLock[lockKey];
    
    if (lock && lock.expiresAt > nowTime) {
      return NextResponse.json({ 
        error: 'ORDER_LOCKED', 
        message: 'This order is currently being processed' 
      }, { status: 409 });
    }

    // Create lock
    eventLock[lockKey] = {
      lockedBy: userId,
      expiresAt: nowTime + 10000 // 10 seconds lock
    };

    try {

    // STEP 2: Fetch current row data
    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!A${rowNumber}:V${rowNumber}`,
    });

    const rowData = rowRes.data.values?.[0] || [];
    // Pad to 22 columns
    while (rowData.length < 22) rowData.push('');

    const customer = rowData[1];
    const currentStatusStr = rowData[10] || '';
    const lifecycleStr = rowData[21] || '[]';

    let currentStage: OrderStage = 'ADMIN';
    let currentState: OrderState = 'IN_PROGRESS';

    if (currentStatusStr.includes('_')) {
      const parts = currentStatusStr.split('_');
      // e.g. PRODUCTION_WAITING
      currentStage = parts[0] as OrderStage;
      currentState = parts.slice(1).join('_') as OrderState;
    } else if (currentStatusStr) {
      // Legacy fallback
      const low = currentStatusStr.toLowerCase();
      if (low.includes('produksi')) { currentStage = 'PRODUCTION'; currentState = 'ACCEPTED'; }
      else if (low.includes('packing')) { currentStage = 'PACKING'; currentState = 'ACCEPTED'; }
      else if (low.includes('delivery')) { currentStage = 'DELIVERY'; currentState = 'ACCEPTED'; }
      else if (low.includes('diterima')) { currentStage = 'COMPLETED'; currentState = 'COMPLETED'; }
      else if (low.includes('dikonfirmasi')) { currentStage = 'PRODUCTION'; currentState = 'WAITING'; }
    }

    let lifecycleData: LifecycleEvent[] = [];
    try {
      lifecycleData = JSON.parse(lifecycleStr);
    } catch (e) {
      lifecycleData = [];
    }

    // STEP 3: Validate Permission based on Role and Action
    const isSuperAdmin = role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin) {
      if (action === 'OVERRIDE') {
        return NextResponse.json({ success: false, error: 'Only SUPER_ADMIN can override' }, { status: 403 });
      }

      if (action === 'ACCEPT' || action === 'COMPLETE') {
        if (role !== currentStage && role !== 'OWNER') { // OWNER just for view, maybe shouldn't accept, but role check is strict
          return NextResponse.json({ success: false, error: `Role ${role} cannot ${action} in stage ${currentStage}` }, { status: 403 });
        }
      }

      if (action === 'QC_CHECK') {
        if (role !== currentStage && role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: `Role ${role} cannot perform QC in stage ${currentStage}` }, { status: 403 });
        }
      }

      if (action === 'HANDOVER' || action === 'REJECT') {
        if (role !== currentStage && role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: `Role ${role} cannot ${action} from stage ${currentStage}` }, { status: 403 });
        }
      }
    }

    // PHASE 2: QC GATE (RULE 1 & 3)
    if (action === 'HANDOVER' && (currentStage === 'PRODUCTION' || currentStage === 'PACKING')) {
      const isOverride = isSuperAdmin && body.overrideQc;
      if (currentState !== 'QC_PASSED' && !isOverride) {
        return NextResponse.json({ 
          error: 'QC_REQUIRED', 
          message: `Cannot handover from ${currentStage} without QC_PASSED.` 
        }, { status: 400 });
      }
    }

    // 3. STATE TRANSITION VALIDATOR (FINITE STATE MACHINE)
    if (action === 'HANDOVER' && targetStage) {
      const allowedTargets = allowedTransitions[currentStage] || [];
      if (!allowedTargets.includes(targetStage)) {
        return NextResponse.json({ 
          error: 'INVALID_STATE_TRANSITION', 
          message: `Transition from ${currentStage} to ${targetStage} is not allowed` 
        }, { status: 400 });
      }
    }

    // Determine next stage and state
    let nextStage: OrderStage = currentStage;
    let nextState: OrderState = currentState;

    if (action === 'HANDOVER') {
      nextStage = targetStage || currentStage;
      nextState = 'WAITING';
    } else if (action === 'ACCEPT') {
      nextState = 'ACCEPTED';
    } else if (action === 'COMPLETE') {
      if (currentStage === 'PRODUCTION' || currentStage === 'PACKING') {
        nextState = 'QC_PENDING';
      } else {
        nextState = 'COMPLETED';
        if (targetStage) {
          nextStage = targetStage;
          nextState = 'WAITING';
        }
      }
    } else if (action === 'QC_CHECK') {
      const qcData = body.qc;
      if (qcData?.status === 'PASSED') {
        nextState = 'QC_PASSED';
      } else if (qcData?.status === 'FAILED') {
        nextState = 'REWORK_REQUIRED';
      } else {
        return NextResponse.json({ error: 'INVALID_QC', message: 'QC status must be PASSED or FAILED' }, { status: 400 });
      }
    } else if (action === 'REJECT') {
      nextStage = 'ADMIN';
      nextState = 'REVIEW_REQUIRED';
    } else if (action === 'OVERRIDE') {
      if (targetStage) nextStage = targetStage;
      if (body.targetState) nextState = body.targetState;
    }

    // Calculate SLA Snapshot if applicable
    const now = new Date().toISOString();
    let handoverAt: string | undefined;
    let acceptedAt: string | undefined;
    let completedAt: string | undefined;

    if (action === 'ACCEPT') {
      // Find the last HANDOVER event to this stage
      const lastHandover = [...lifecycleData].reverse().find(e => e.event === 'HANDOVER' && e.toStage === currentStage);
      if (lastHandover) {
        handoverAt = lastHandover.timestamp;
        acceptedAt = now;
      }
    } else if (action === 'COMPLETE') {
      const lastAccept = [...lifecycleData].reverse().find(e => e.event === 'ACCEPT' && e.stage === currentStage);
      if (lastAccept) {
        acceptedAt = lastAccept.timestamp;
        completedAt = now;
      }
    }

    // STEP 4: Generate Event
    const newEvent: LifecycleEvent = {
      version: "1.0",
      eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      event: action as EventType,
      source: "WEB_APP",
      actor: {
        userId: emailOrUser,
        name: userName,
        role: role
      },
      timestamp: now,
      stage: currentStage,
      fromStage: action === 'HANDOVER' ? currentStage : undefined,
      toStage: action === 'HANDOVER' ? nextStage : undefined,
      assignedTo: assignedTo,
      assignedToId: assignedToId,
      department: department,
      reason: reason || (action === 'REJECT' ? notes : undefined),
      notes: notes,
      attachments: attachments || [],
      handoverAt,
      acceptedAt,
      completedAt,
      qc: action === 'QC_CHECK' ? body.qc : undefined
    };

    lifecycleData.push(newEvent);

    // PHASE 2: AUTO GENERATE NCR IF QC FAILED
    if (action === 'QC_CHECK' && body.qc?.status === 'FAILED') {
      const ncrEvent: LifecycleEvent = {
        version: "1.0",
        eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}_NCR`,
        event: 'NCR_CREATED' as EventType,
        source: "WEB_APP",
        actor: { userId: emailOrUser, name: userName, role: role },
        timestamp: now,
        stage: currentStage,
        ncr: body.ncr || {
          issueType: 'QUALITY',
          severity: 'HIGH',
          description: notes || 'QC FAILED AUTOMATIC NCR',
        }
      };
      lifecycleData.push(ncrEvent);
    }

    // Update Sheets
    const newStatusStr = `${nextStage}_${nextState}`;
    rowData[10] = newStatusStr;
    rowData[21] = JSON.stringify(lifecycleData);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!A${rowNumber}:V${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    // STEP 5: Audit Log Integration
    writeAuditLogServer({
      sheets, spreadsheetId: SPREADSHEET_ID,
      userId: emailOrUser,
      userName: userName,
      module: 'ORDER',
      action: `LIFECYCLE_${action}`,
      entityType: 'ORDER',
      entityId: String(orderId || rowNumber),
      description: `Lifecycle ${action} oleh ${userName} (${role}). Status: ${newStatusStr}. ${notes ? `Catatan: ${notes}` : ''}`,
      beforeData: { status: currentStatusStr },
      afterData: { status: newStatusStr, eventId: newEvent.eventId }
    });

    // STEP 6: Invalidate Server Cache
    invalidateCache('orders_data');

    return NextResponse.json({ success: true, event: newEvent, newStatus: newStatusStr });

    } finally {
      // Release lock
      delete eventLock[lockKey];
    }

  } catch (error: any) {
    console.error('Lifecycle API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
