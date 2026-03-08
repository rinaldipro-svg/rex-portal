# Templates Feature - Setup & Deployment Guide

## Prerequisites

- Backend running on Node.js 18+
- PostgreSQL 14+
- Frontend running Next.js 14
- All dependencies installed

## Step-by-Step Setup

### 1. Database Migration

The templates feature requires creating new database tables. Run the migration:

```bash
cd backend
node src/db/migrations/001_create_templates.js
```

**What this does:**
- Creates `templates` table for fiche templates
- Creates `template_sections` table for reusable sections
- Creates `template_section_usage` table (for future features)
- Sets up indexes for performance
- Creates triggers for automatic timestamp updates

### 2. Verify Database Tables

Connect to your PostgreSQL database and verify tables were created:

```sql
-- Check templates table
SELECT * FROM templates LIMIT 1;

-- Check template_sections table
SELECT * FROM template_sections LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'templates';
SELECT indexname FROM pg_indexes WHERE tablename = 'template_sections';
```

### 3. Backend Deployment

No additional setup needed - the templates routes are automatically registered via `server.js`

**Verify the API is working:**
```bash
# Test templates endpoint (with valid auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/templates

# Should return:
# {
#   "templates": [],
#   "total": 0,
#   "limit": 50,
#   "offset": 0
# }
```

### 4. Frontend Deployment

1. Clear Next.js cache:
```bash
cd frontend
rm -r .next
```

2. Rebuild the application:
```bash
npm run build
```

3. Test locally:
```bash
npm run dev
```

4. Access the templates page:
- Navigate to: http://localhost:3000/templates
- You should see the templates management interface

### 5. Verify All Features

#### Template Management
- [ ] Can create fiche template
- [ ] Can create section template
- [ ] Can edit templates (as owner)
- [ ] Can delete templates (as owner)
- [ ] Can search templates
- [ ] Can filter by category
- [ ] Shared/personal toggle works
- [ ] Modal forms open/close properly

#### Template Usage
- [ ] Can use template to create fiche (from templates page)
- [ ] Can load template via ?templateId= parameter in editor
- [ ] Template data pre-fills fiche editor
- [ ] Can save fiche created from template

#### Navigation
- [ ] Dashboard has Templates button (blue button)
- [ ] Editor has Templates button in toolbar
- [ ] Can navigate between pages smoothly
- [ ] Dashboard shows Templates link

## File Structure

```
rex-portal/
├── backend/
│   └── src/
│       ├── server.js                    # [MODIFIED] Added templates route
│       ├── db/
│       │   └── migrations/
│       │       └── 001_create_templates.js  # [NEW] Database migration
│       └── routes/
│           └── templates.js             # [NEW] Templates API routes
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── templates/
    │   │   │   └── page.tsx             # [NEW] Templates management page
    │   │   ├── dashboard/
    │   │   │   └── page.tsx             # [MODIFIED] Added template button
    │   │   └── editor/
    │   │       └── page.tsx             # [MODIFIED] Template loading support
    │   └── lib/
    │       └── api.ts                   # [MODIFIED] Added templates API
    │
    └── ...
```

## Testing the Feature

### Create a Test Template

1. Go to Dashboard
2. Click "Templates" button
3. In Fiche Templates tab, click "+ Nouveau"
4. Fill in:
   - Name: "Infrastructure Test Template"
   - Description: "Test template for infrastructure"
   - Category: "infrastructure"
   - Leave Shared checked
5. Click "Créer"

### Use the Template

1. From the templates page, click "➕ Utiliser comme base"
2. Editor opens with template data pre-filled
3. Modify the title and content
4. Click "💾 Sauvegarder"
5. Should return to dashboard with new fiche created

### Create a Test Section

1. Go to Templates page
2. Click "Sections Réutilisables" tab
3. Click "+ Nouveau"
4. Fill in:
   - Name: "Standard Infrastructure Setup"
   - Type: "infrastructure"
   - Content: "Standard infrastructure configuration for new deployments"
   - Category: "general"
5. Click "Créer"

## Troubleshooting

### Database Migration Fails

**Issue:** Error about permissions or missing tables

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL environment variable is correct
3. Ensure user has CREATE TABLE permissions
4. Try running migration with elevated privileges if needed

### Templates Page Shows Error

**Issue:** "Erreur lors de la récupération des templates"

**Solution:**
1. Verify backend API is running
2. Check browser console for errors
3. Verify authentication token is valid
4. Restart backend service: `npm run dev`

### Cannot Create Template

**Issue:** "Un template avec ce nom existe déjà"

**Solution:**
- Template names must be unique per user
- Try a different name
- Or delete the existing template first

### Editor Template Loading Fails

**Issue:** Template data doesn't load when using ?templateId=

**Solution:**
1. Verify templateId is a valid UUID
2. Check template is shared or belongs to logged-in user
3. Check browser network tab for API errors
4. Verify backend returns template data correctly

## Performance Considerations

- Templates are indexed by category, created_by, and is_shared
- List queries use pagination (limit/offset)
- Add indexes if searching large numbers of templates
- Consider archiving old templates periodically

## Security Considerations

- Templates can only be edited/deleted by their creator
- Shared templates are read-only for other users
- All routes require authentication (authenticateToken middleware)
- User context is enforced via req.user.id from JWT token

## Rollback Procedure

If you need to remove the templates feature:

```sql
-- DROP tables (WARNING: This will delete all templates data)
DROP TABLE IF EXISTS template_section_usage CASCADE;
DROP TABLE IF EXISTS template_sections CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_templates_updated_at();
DROP FUNCTION IF EXISTS update_template_sections_updated_at();
```

Then revert code changes to:
- `backend/src/server.js`
- `frontend/src/lib/api.ts`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/editor/page.tsx`

## Next Steps

1. Run the database migration
2. Restart backend service
3. Clear frontend cache and rebuild
4. Test all features
5. Deploy to production

## Support

For issues or questions:
1. Check the TEMPLATES_FEATURE.md documentation
2. Review API endpoint specifications
3. Check browser console for client-side errors
4. Check backend logs for server-side errors
5. Verify JWT tokens are valid
6. Ensure all files are properly saved without syntax errors
