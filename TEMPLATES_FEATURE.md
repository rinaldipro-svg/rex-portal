# Templates Feature - Rex Portal

## Overview

The Templates feature allows users to create, edit, and manage reusable templates for REX (Retour d'Expérience) fiches. This feature includes two types of templates:

1. **Fiche Templates** - Complete REX fiche templates that users can duplicate as a starting point
2. **Section Templates** - Reusable content snippets for specific sections (Infrastructure, Technology, Security, etc.)

## Features

### ✨ Fiche Templates

Create complete fiche templates with all fields pre-populated:
- Name and description
- Infrastructure details
- UNSPSC codes and descriptions
- Context and constraints
- Technologies and engineering approaches
- Security measures
- Key metrics
- Citations and authors
- Categorization and sharing controls

**Use Cases:**
- Save time by creating templates for common scenarios
- Ensure consistency across similar REX documents
- Share department-wide best practices
- Create starting points for different infrastructure types

### 🔧 Section Templates

Create reusable content blocks for specific fiche sections:
- **Infrastructure** - Describe infrastructure setup and configuration
- **Technologie** - Detail technologies and technical approaches
- **Sécurité** - Document security measures and protocols
- **Environnement** - Describe environmental context
- **Contrainte** - List constraints and limitations

**Use Cases:**
- Maintain standard wording for recurring sections
- Quickly build new fiches using proven content blocks
- Share team best practices
- Ensure technical accuracy across documents

### 🔐 Sharing & Access Control

- **Personal Templates** - Only visible to the creator
- **Shared Templates** - Visible to all users in the organization
- **Copy on Use** - Templates are never modified when creating fiches from them

## How to Use

### Creating a Fiche Template

1. Navigate to **Templates** from the dashboard
2. Click the **"+ Nouveau"** button in the "Templates de Fiches" tab
3. Fill in the template details:
   - **Name** - Unique identifier for the template
   - **Description** - What this template is for
   - **Category** - Categorize by type (General, Infrastructure, Technology, Security)
   - **Shared** - Toggle to share with organization
4. Click **"Créer"** to save

To edit an existing template:
1. Click **"✏️ Modifier"** on any template card
2. Update the details as needed
3. Click **"Mettre à jour"**

### Creating a Section Template

1. Navigate to **Templates** from the dashboard
2. Click the **"Sections Réutilisables"** tab
3. Click **"+ Nouveau"**
4. Fill in the section details:
   - **Name** - Identifier for the section
   - **Type** - Select the section type (Infrastructure, Technology, Security, etc.)
   - **Content** - The actual content to reuse
   - **Category** - Categorize the section
   - **Shared** - Toggle to share with organization
5. Click **"Créer"**

### Using a Template to Create a Fiche

**Method 1: From Templates Page**
1. Go to **Templates**
2. Find the template you want to use
3. Click **"➕ Utiliser comme base"**
4. The fiche editor opens with the template data pre-filled
5. Modify as needed and save as a new fiche

**Method 2: From Dashboard**
1. Templates button in the dashboard toolbar
2. Select and use a template as described above

## API Endpoints

### Fiche Templates

```
GET    /api/templates                    # List templates
GET    /api/templates/:id                # Get specific template
POST   /api/templates                    # Create template
PUT    /api/templates/:id                # Update template (owner only)
DELETE /api/templates/:id                # Delete template (owner only)
```

**Query Parameters for LIST:**
- `category` - Filter by category
- `search` - Search by name or description
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

### Section Templates

```
GET    /api/templates/sections           # List sections
GET    /api/templates/sections/:id       # Get specific section
POST   /api/templates/sections           # Create section
PUT    /api/templates/sections/:id       # Update section (owner only)
DELETE /api/templates/sections/:id       # Delete section (owner only)
```

**Query Parameters for LIST:**
- `section_type` - Filter by type (infrastructure, technologie, sécurité, etc.)
- `category` - Filter by category
- `search` - Search by name
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

## Database Schema

### Templates Table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_shared BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- All fiche fields ...
  titre, infrastructure, unspsc_code, etc.
)
```

### Template Sections Table
```sql
CREATE TABLE template_sections (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  section_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_shared BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Frontend Components

### Pages
- **`/templates`** - Main templates management page with two tabs:
  - Fiche Templates tab
  - Section Templates tab

### Features in Editor
- New "Templates" button in the editor toolbar
- Ability to load template data when creating from a template (via `?templateId=` query param)

### Features in Dashboard
- "Templates" button in the header
- Easy access to template management

## Best Practices

### For Creating Reusable Templates
1. **Clear Naming** - Use descriptive names that indicate the template's purpose
2. **Categorization** - Use categories consistently for easy discovery
3. **Documentation** - Add descriptions explaining when/how to use the template
4. **Sharing** - Share only thoroughly tested and reviewed templates
5. **Maintenance** - Periodically review and update outdated templates

### For Using Templates
1. **Review Content** - Always review template content before using it
2. **Customize** - Tailor each fiche to its specific context
3. **Complete Fields** - Don't skip required fields even if template suggests otherwise
4. **Version Control** - Keep track of template changes in version notes

## Migration

To enable the templates feature, run the migration:

```bash
cd backend
node src/db/migrations/001_create_templates.js
```

This migration creates:
- `templates` table
- `template_sections` table
- `template_section_usage` table (for future use)
- Appropriate indexes and triggers

## Future Enhancements

Potential features for future versions:
- [ ] Clone templates to create variations
- [ ] Template version history
- [ ] Template sharing with specific users/groups
- [ ] Template usage statistics
- [ ] AI-powered template suggestions
- [ ] Bulk template management
- [ ] Template export/import
- [ ] Template approval workflow
- [ ] Section templates usage tracking in fiches
