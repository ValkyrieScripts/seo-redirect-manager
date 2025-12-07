import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit, Eye, FolderKanban } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import type { Project, ProjectFormData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch (err) {
      toast.error('Failed to load projects');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const handleAddProject = async () => {
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await projectsApi.create(formData);
      toast.success('Project created successfully');
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to create project');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = async () => {
    if (!editingProject) return;
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await projectsApi.update(editingProject.id, formData);
      toast.success('Project updated successfully');
      setEditingProject(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to update project');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setIsSubmitting(true);
    try {
      await projectsApi.delete(deletingProject.id);
      toast.success('Project deleted successfully');
      setDeletingProject(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete project');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
    });
    setEditingProject(project);
  };

  if (isLoading) {
    return <LoadingState message="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organize domains into projects
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Domains</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableEmpty colSpan={5} message="No projects found" />
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-primary-600" />
                      <span className="font-medium">{project.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-gray-500">
                    {project.description || '-'}
                  </TableCell>
                  <TableCell>{project.domain_count || 0}</TableCell>
                  <TableCell>{formatDate(project.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(project)}
                        title="Edit project"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProject(project)}
                        title="Delete project"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="New Project"
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Project Name"
            placeholder="My Project"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            id="description"
            label="Description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProject} isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => {
          setEditingProject(null);
          resetForm();
        }}
        title="Edit Project"
      >
        <div className="space-y-4">
          <Input
            id="edit-name"
            label="Project Name"
            placeholder="My Project"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            id="edit-description"
            label="Description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditingProject(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProject} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{deletingProject?.name}</strong>?
            Domains in this project will not be deleted but will be unassigned.
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} isLoading={isSubmitting}>
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
