import { prisma } from '../lib/db/prisma'

const INITIAL_CATEGORIES = [
  { name: 'SPORTS', label: 'Sports', icon: '🏈', color: '#10B981', sortOrder: 1 },
  { name: 'POLITICS', label: 'Politics', icon: '🏛️', color: '#3B82F6', sortOrder: 2 },
  { name: 'TECH', label: 'Tech', icon: '💻', color: '#8B5CF6', sortOrder: 3 },
  { name: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬', color: '#F59E0B', sortOrder: 4 },
  { name: 'SCIENCE', label: 'Science', icon: '🔬', color: '#06B6D4', sortOrder: 5 },
  { name: 'OTHER', label: 'Other', icon: '💭', color: '#6B7280', sortOrder: 6 },
]

async function seedCategories() {
  console.log('Seeding categories...')

  for (const category of INITIAL_CATEGORIES) {
    try {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {
          label: category.label,
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
        },
        create: {
          name: category.name,
          label: category.label,
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      })
      console.log(`✓ ${category.label}`)
    } catch (error) {
      console.error(`✗ Failed to seed ${category.label}:`, error)
    }
  }

  console.log('Categories seeded successfully!')
}

seedCategories()
  .catch((error) => {
    console.error('Error seeding categories:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })










