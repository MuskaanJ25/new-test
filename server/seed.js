import { getDb } from './db.js'

const MENU_ITEMS = [
  {
    name: 'Espresso',
    description: 'Rich, bold single or double shot espresso',
    price_cents: 350
  },
  {
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and velvety foam art',
    price_cents: 450
  },
  {
    name: 'Latte',
    description: 'Smooth espresso with steamed milk and light foam',
    price_cents: 450
  },
  {
    name: 'Americano',
    description: 'Espresso with hot water for a smooth, full-bodied taste',
    price_cents: 350
  },
  {
    name: 'Mocha',
    description: 'Espresso with chocolate and steamed milk, topped with whipped cream',
    price_cents: 550
  },
  {
    name: 'Cold Brew',
    description: 'Smooth, refreshing iced coffee steeped for 18 hours',
    price_cents: 450
  },
  {
    name: 'Iced Latte',
    description: 'Chilled espresso and milk over ice',
    price_cents: 500
  },
  {
    name: 'Macchiato',
    description: 'Espresso marked with a dollop of steamed milk foam',
    price_cents: 400
  },
  {
    name: 'Avocado Toast',
    description: 'Sourdough bread topped with smashed avocado, cherry tomatoes, and microgreens',
    price_cents: 1200
  },
  {
    name: 'Classic Breakfast',
    description: 'Two eggs, bacon, toast, and home fries',
    price_cents: 1400
  },
  {
    name: 'Belgian Waffles',
    description: 'Golden waffles with maple syrup, fresh berries, and whipped cream',
    price_cents: 1100
  },
  {
    name: 'Eggs Benedict',
    description: 'Poached eggs on English muffin with Canadian bacon and hollandaise',
    price_cents: 1350
  },
  {
    name: 'Caesar Salad',
    description: 'Crisp romaine, parmesan, croutons, and house-made dressing',
    price_cents: 1050
  },
  {
    name: 'Quiche',
    description: 'Daily selection with mixed greens salad',
    price_cents: 1300
  },
  {
    name: 'Grilled Chicken Sandwich',
    description: 'Grilled chicken breast, arugula, tomato on ciabatta',
    price_cents: 1350
  },
  {
    name: 'Soup of the Day',
    description: 'House-made soup with crusty bread',
    price_cents: 850
  },
  {
    name: 'Chocolate Croissant',
    description: 'Buttery, flaky pastry filled with dark chocolate',
    price_cents: 450
  },
  {
    name: 'Blueberry Scone',
    description: 'Fresh-baked scone with clotted cream and jam',
    price_cents: 400
  },
  {
    name: 'Cinnamon Roll',
    description: 'Warm, gooey cinnamon roll with cream cheese frosting',
    price_cents: 500
  },
  {
    name: 'Fruit Tart',
    description: 'Seasonal fruits on vanilla custard in buttery pastry',
    price_cents: 600
  },
  {
    name: 'Cheesecake',
    description: 'creamy New York-style cheesecake with berry coulis',
    price_cents: 750
  },
  {
    name: 'Matcha Latte',
    description: 'Premium Japanese green tea with steamed milk',
    price_cents: 500
  },
  {
    name: 'Chai Latte',
    description: 'Spiced tea with steamed milk and foam',
    price_cents: 500
  },
  {
    name: 'Flat White',
    description: 'Velvety microfoam coffee with a double ristretto',
    price_cents: 450
  }
]

export function seedMenuItems() {
  try {
    const db = getDb()
    
    // Check if menu items already exist
    const count = db.prepare('SELECT COUNT(*) as count FROM menu_items').get()
    
    if (count.count > 0) {
      console.log('✓ Menu items already exist, skipping seed')
      return
    }

    // Insert menu items
    const insert = db.prepare(`
      INSERT INTO menu_items (name, description, price_cents, is_active)
      VALUES (?, ?, ?, 1)
    `)

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item.name, item.description, item.price_cents)
      }
    })

    insertMany(MENU_ITEMS)
    
    console.log(`✓ Seeded ${MENU_ITEMS.length} menu items`)
  } catch (error) {
    console.error('Error seeding menu items:', error)
  }
}