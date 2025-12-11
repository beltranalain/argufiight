# Plans Board (Trello-like) Migration

## What Was Added

A complete Trello-like kanban board system in the admin dashboard at `/admin/plans`.

## Database Models

1. **Board** - Top-level container for lists
   - name, description, color, isArchived

2. **List** - Columns within a board
   - boardId, name, position, isArchived

3. **Card** - Items within lists
   - listId, title, description, position, dueDate, isArchived

4. **CardLabel** - Color-coded labels for cards
   - cardId, name, color

## Migration Steps

1. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev --name add_plans_board
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Verify**:
   - Visit `/admin/plans` in the admin dashboard
   - You should see the Plans page with board management

## Features

### Boards
- Create multiple boards
- Switch between boards via dropdown
- Board header with customizable color
- Board description

### Lists
- Create lists within boards
- Edit list names (click to edit)
- Delete lists (with confirmation)
- Horizontal scrolling layout
- Drag and drop reordering (coming soon)

### Cards
- Create cards in any list
- Edit cards with rich text editor
- Delete cards
- Drag and drop between lists
- Drag and drop within lists
- Due dates
- Color-coded labels
- Card descriptions with rich text

### Drag and Drop
- Cards can be dragged between lists
- Cards can be reordered within lists
- Visual feedback during drag (highlighted drop zones)
- Automatic position updates

## API Endpoints

### Boards
- `GET /api/admin/boards` - List all boards
- `POST /api/admin/boards` - Create board
- `GET /api/admin/boards/[id]` - Get board
- `PATCH /api/admin/boards/[id]` - Update board
- `DELETE /api/admin/boards/[id]` - Delete board

### Lists
- `GET /api/admin/lists?boardId=xxx` - Get lists for board
- `POST /api/admin/lists` - Create list
- `PATCH /api/admin/lists/[id]` - Update list
- `DELETE /api/admin/lists/[id]` - Delete list
- `POST /api/admin/lists/reorder` - Reorder lists

### Cards
- `POST /api/admin/cards` - Create card
- `GET /api/admin/cards/[id]` - Get card
- `PATCH /api/admin/cards/[id]` - Update card
- `DELETE /api/admin/cards/[id]` - Delete card
- `POST /api/admin/cards/reorder` - Reorder cards (drag and drop)
- `POST /api/admin/cards/[id]/labels` - Add label to card
- `DELETE /api/admin/cards/[id]/labels/[labelId]` - Remove label

## Usage

1. Go to `/admin/plans` in admin dashboard
2. Create a new board or select existing
3. Add lists to organize your work
4. Add cards to lists
5. Drag cards between lists or reorder within lists
6. Click cards to edit details, add labels, set due dates
7. Use rich text editor for card descriptions

## Notes

- All operations require admin authentication
- Cards and lists are soft-deleted (isArchived flag)
- Positions are automatically managed for drag-and-drop
- Board colors default to Trello blue (#0079bf)

