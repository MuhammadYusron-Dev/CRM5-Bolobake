import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Role } from '@/lib/types';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: Role;
}

export function UserManager({ currentUser }: { currentUser?: { userId: string; name: string; role: string } | null }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || 'Gagal mengambil data pengguna.');
      }
    } catch (e: any) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (email: string, newRole: string) => {
    setUpdating(email);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newRole })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.email === email ? { ...u, role: newRole as Role } : u));
      } else {
        alert(data.message || 'Gagal mengubah jabatan.');
      }
    } catch (e: any) {
      alert('Terjadi kesalahan jaringan saat mengubah jabatan.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm text-slate-500">Memuat data pengguna...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
        <AlertTriangle className="w-5 h-5" /> {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna (Hak Akses)</h2>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold text-slate-700">Daftar Akun Pegawai</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-tl-lg">Pengguna</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold text-center">Jabatan / Akses (Role)</th>
                <th className="px-4 py-3 font-semibold rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.firstName} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className="font-medium text-slate-800">{`${u.firstName} ${u.lastName || ''}`.trim() || 'Unknown User'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={
                      u.role === 'SYSTEM_ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      u.role === 'OWNER' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      u.role === 'ADMIN' ? 'bg-slate-100 text-slate-700' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }>
                      {u.role || 'ADMIN'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {updating === u.email ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
                    ) : currentUser?.role === 'OWNER' ? (
                      <span className="text-xs text-slate-400 italic">Read-Only</span>
                    ) : (
                      <Select 
                        value={u.role || 'ADMIN'} 
                        onValueChange={(val) => handleRoleChange(u.email, val)}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN</SelectItem>
                          <SelectItem value="OWNER">OWNER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="SALES">SALES</SelectItem>
                          <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                          <SelectItem value="PACKING">PACKING</SelectItem>
                          <SelectItem value="DELIVERY">DELIVERY</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
