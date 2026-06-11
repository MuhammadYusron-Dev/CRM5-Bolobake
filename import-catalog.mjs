import { google } from 'googleapis';
import fs from 'fs';

// Read from .env.local manually
const envRaw = fs.readFileSync('.env.local', 'utf8');
const env = {};
envRaw.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;

const rawCatalog = [
  // Classic Croissant
  ['Butter Croissant 30gr', 'Croissant', 5000],
  ['Butter Croissant 50gr', 'Croissant', 7000],
  ['Butter Croissant 75gr', 'Croissant', 11000],
  ['Triple Cheese Croissant 30gr', 'Croissant', 6500],
  ['Triple Cheese Croissant 50gr', 'Croissant', 9500],
  ['Triple Cheese Croissant 75gr', 'Croissant', 14000],
  ['Pain Au Choco 30gr', 'Croissant', 6500],
  ['Pain Au Choco 50gr', 'Croissant', 9500],
  ['Pain Au Choco 75gr', 'Croissant', 14000],
  ['Almond Croissant 30gr', 'Croissant', 7000],
  ['Almond Croissant 50gr', 'Croissant', 10000],
  ['Almond Croissant 75gr', 'Croissant', 15000],
  ['CROFFLE 30gr', 'Croffle', 5000],
  ['CROFFLE 50gr', 'Croffle', 7000],
  ['CROFFLE 80gr', 'Croffle', 12000],
  ['Kouign Amman', 'Pastry', 12000],
  ['Danish Cinnamon', 'Pastry', 12000],
  ['Pain Au Suisse', 'Pastry', 16000],
  ['Smoked Beef & Cheese', 'Pastry', 17000],
  ['Tiger Hazelnut', 'Pastry', 15000],
  ['Redvelvet Croissant', 'Croissant', 15000],
  ['Cereal Croissant Jar 300 ML', 'Pastry', 13000],
  ['Cereal Croissant Jar 600 ML', 'Pastry', 30000],
  
  // New Trend Croissant
  ['CROMBOLONI Redvelvet', 'Cromboloni', 14000],
  ['CROMBOLONI Tiramisu', 'Cromboloni', 14000],
  ['CROMBOLONI Strawberry', 'Cromboloni', 14000],
  ['CROMBOLONI Choco', 'Cromboloni', 14000],
  ['CROMBOLONI Matcha', 'Cromboloni', 14000],
  ['MOCHI CROISSANT Tiramisu', 'Croissant', 15000],
  ['MOCHI CROISSANT Matcha', 'Croissant', 15000],
  ['MOCHI CROISSANT Choco', 'Croissant', 15000],
  ['Pistachio Strawberry Croissant', 'Croissant', 19000],
  ['DUBAI SERIES CROISSANT KUNAFA PISTACHIO', 'Croissant', 22000],
  ['DUBAI SERIES DANISH KUNAFA PISTACHIO', 'Pastry', 22000],
  ['Banana Choco', 'Pastry', 16000],
  ['Apple Crumble', 'Pastry', 18000],
  ['Ribbon Hazelnut', 'Pastry', 16000],
  ['Vanilla Red', 'Pastry', 16000],
  ['Palmier', 'Pastry', 11000],
  ['Danish Strawberry', 'Pastry', 16000],
  ['Quiches Mushroom', 'Quiche', 15000],
  ['Quiches Smoked Beef', 'Quiche', 15000],

  // Bagels
  ['SESAME BAGEL 60gr', 'Bagel', 6000],
  ['SESAME BAGEL 80gr', 'Bagel', 7000],
  ['CHEESE BAGEL 60gr', 'Bagel', 7000],
  ['CHEESE BAGEL 80gr', 'Bagel', 8000],
  ['CHEESE BAGEL FILLING', 'Bagel', 13000],
  ['DIRTY CHOCO BAGEL', 'Bagel', 13000],
  ['COFFEE BUN BAGEL', 'Bagel', 14000],
  ['PIZZA CHEESE BAGEL', 'Bagel', 15000],
  ['GARLIC CREAMCHEESE BAGEL', 'Bagel', 15000],
  ['RAINBOW MEISES BAGEL', 'Bagel', 15000],
  ['CLASSIC MEISES BAGEL', 'Bagel', 15000],
  ['CINNAMON BAGEL', 'Bagel', 14000],

  // Artisan Bread
  ['Burger Bun Mini', 'Bread', 2000],
  ['Burger Bun Regular', 'Bread', 4000],
  ['Burger Bun Large', 'Bread', 6000],
  ['Black Burger Reg', 'Bread', 5000],
  ['Black Burger Large', 'Bread', 7000],
  ['Hot Dog Bun 50gr', 'Bread', 2500],
  ['Hot Dog Bun 80gr', 'Bread', 4000],
  ['Thin Crust Pizza 15cm', 'Bread', 5500],
  ['Thin Crust Pizza 22cm', 'Bread', 8000],
  ['Baguette', 'Bread', 16000],
  ['Rustic Bread 300gr', 'Bread', 25000],
  ['Rustic Bread 500gr', 'Bread', 35000],
  ['Brioche Loaf', 'Bread', 30000],
  ['Cromboloni polos', 'Cromboloni', 10000],
  ['Cangkang polos', 'Pastry', 11000],

  // Salt Bread
  ['ORIGINAL SALTBREAD', 'Salt Bread', 12000],
  ['CHOCO SALTBREAD', 'Salt Bread', 14000],
  ['GARLIC & CHEESE SALTBREAD', 'Salt Bread', 14000],
  ['PREMIUM SMOKED BEEF & CHEESE SALTBREAD', 'Salt Bread', 15000],
  ['LATTINI TOPPING 1 PAX', 'Salt Bread', 30000],

  // Sweets
  ['THAILAND MILKBUN Milky Cheese', 'Sweets', 18000],
  ['THAILAND MILKBUN Cocopandan', 'Sweets', 18000],
  ['THAILAND MILKBUN Chocolate', 'Sweets', 18000],
  ['THAILAND MILKBUN Strawberry', 'Sweets', 18000],
  ['TOM & JERRY CHEESECAKE Original', 'Sweets', 15000],
  ['TOM & JERRY CHEESECAKE Strawberry', 'Sweets', 15000],
  ['TOM & JERRY CHEESECAKE Blueberry', 'Sweets', 15000],
  ['TOM & JERRY CHEESECAKE Chocolate', 'Sweets', 15000],
  ['ORIGINAL BURNT CHEESECAKE', 'Sweets', 180000],
  ['BROWNIE BURNT CHEESECAKE', 'Sweets', 180000],
  ['MATCHA BURNT CHEESECAKE', 'Sweets', 185000],
  ['Tiramisu Classic', 'Sweets', 21000],
  ['Tiramisu Pistachio', 'Sweets', 22000],
  ['Macarons Pistachio', 'Sweets', 9000],
  ['Macarons Lemon', 'Sweets', 9000],
  ['Macarons Orange', 'Sweets', 9000],
  ['Macarons Vanilla Blue', 'Sweets', 9000],
  ['Macarons Strawberry', 'Sweets', 9000],
  ['Macarons Taro', 'Sweets', 9000],
  ['Macarons Redvelvet', 'Sweets', 9000],
  ['Macarons Salted Caramel', 'Sweets', 9000],
  ['Macarons Coffee', 'Sweets', 9000],
  ['Macarons Chocolate', 'Sweets', 9000],

  // Cake N Cookies
  ['OPERA CAKE', 'Cake', 22000],
  ['TRIPLE CHOCO', 'Cake', 22000],
  ['REDVELVET CAKE whole', 'Cake', 160000],
  ['BASQUE BURNT CHEESECAKE Choco whole', 'Cake', 200000],
  ['BASQUE BURNT CHEESECAKE Strawberry whole', 'Cake', 200000],
  ['Rainbow Cake whole', 'Cake', 185000],
  ['Matcha Cream Cake whole', 'Cake', 185000],
  ['Chocolate Cake whole', 'Cake', 160000],
  ['Millescrepe Oreo whole', 'Cake', 220000],
  ['Millescrepe Strawberry Cheese whole', 'Cake', 220000],
  ['Millescrepe Red Velvet whole', 'Cake', 220000],
  ['Millescrepe Tiramisu whole', 'Cake', 220000],
  ['NYC New York Cookies Original', 'Cookies', 9000],
  ['NYC New York Cookies Redvelvet', 'Cookies', 9000],
  ['NYC New York Cookies Bluevelvet', 'Cookies', 9000],

  // Dessert Cup Series
  ['Choco Brownie Parfait', 'Dessert', 18000],
  ['Cookies n cream', 'Dessert', 18000],
  ['Classic Tiramisu', 'Dessert', 20000],
  ['Strawberry shortcake', 'Dessert', 22000],
  ['Strawberry Matcha', 'Dessert', 22000],
  ['Lotus Biscoff', 'Dessert', 25000],

  // Snack Bites
  ['Risol Mayo Original', 'Snack', 4000],
  ['Risol Mayo Pedas', 'Snack', 4000],
  ['Risol Mac and Cheese', 'Snack', 4000],
  ['Risol Ayam Manis', 'Snack', 4000],
  ['Risol Ayam Pedas', 'Snack', 4000],
  ['Risol Ayam Lada Hitam', 'Snack', 4000],
  ['Risol Matcha Cheese', 'Snack', 5000],
  ['Risol Choco Cheese', 'Snack', 5000],
  ['Pastel Goreng Ndeso', 'Snack', 4000],
  ['Pastel Krispi Original', 'Snack', 4000],
  ['Pastel Krispi Keju', 'Snack', 4000],
  ['Kroket Kentang', 'Snack', 3000],
  ['Sosis Solo Goreng', 'Snack', 3000],
];

// Format to match Google Sheets: ['SKU ID', 'Nama Produk', 'Kategori', 'Harga Default', 'Status Aktif']
const formattedData = rawCatalog.map((item, index) => {
  const skuId = `SKU-${String(index + 1).padStart(3, '0')}`;
  return [skuId, item[0], item[1], item[2].toString(), 'TRUE'];
});

async function run() {
  try {
    // Clear existing data
    console.log('Clearing old catalog...');
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A2:E',
    });

    // Insert new data
    console.log('Inserting new catalog...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A2:E' + (formattedData.length + 1),
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: formattedData,
      },
    });

    console.log('Successfully updated the catalog with', formattedData.length, 'items!');
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
