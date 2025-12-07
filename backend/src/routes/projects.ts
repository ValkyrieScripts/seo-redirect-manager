import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { Project, CreateProjectRequest } from '../models/types';

export const projectsRouter = Router();

// Get all projects
projectsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM domains WHERE project_id = p.id) as domain_count
    FROM projects p
    ORDER BY p.name
  `).all();
  res.json(projects);
});

// Get single project
projectsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const project = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM domains WHERE project_id = p.id) as domain_count
    FROM projects p
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json(project);
});

// Create project
projectsRouter.post('/', (req: Request<{}, {}, CreateProjectRequest>, res: Response) => {
  const { name, base_url, description } = req.body;

  if (!name || !base_url) {
    res.status(400).json({ error: 'Name and base_url are required' });
    return;
  }

  const db = getDatabase();

  try {
    const result = db.prepare(`
      INSERT INTO projects (name, base_url, description)
      VALUES (?, ?, ?)
    `).run(name, base_url, description || null);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update project
projectsRouter.put('/:id', (req: Request, res: Response) => {
  const { name, base_url, description } = req.body;
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  try {
    db.prepare(`
      UPDATE projects
      SET name = COALESCE(?, name),
          base_url = COALESCE(?, base_url),
          description = COALESCE(?, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || null, base_url || null, description, req.params.id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete project
projectsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted successfully' });
});

// Get domains for a project
projectsRouter.get('/:id/domains', (req: Request, res: Response) => {
  const db = getDatabase();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const domains = db.prepare(`
    SELECT d.*,
      (SELECT COUNT(*) FROM redirects WHERE domain_id = d.id) as redirect_count,
      (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
    FROM domains d
    WHERE d.project_id = ?
    ORDER BY d.domain_name
  `).all(req.params.id);

  res.json(domains);
});
