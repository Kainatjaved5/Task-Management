// Task Management Application
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || [];
        this.currentTaskId = null;
        this.currentFilter = {
            search: '',
            status: 'all',
            priority: 'all',
            category: 'all'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDefaultCategories();
        this.renderTasks();
        this.renderCategories();
        this.updateDashboard();
        this.updateCategorySelects();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Mobile menu toggle
        document.getElementById('navToggle').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
            document.getElementById('navToggle').classList.toggle('active');
        });

        // Task modal
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Category modal
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('closeCategoryModal').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.handleCategorySubmit(e));

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('statusFilter').addEventListener('change', (e) => this.handleFilter(e));
        document.getElementById('priorityFilter').addEventListener('change', (e) => this.handleFilter(e));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.handleFilter(e));

        // Settings
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    handleNavigation(e) {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Show corresponding section
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Close mobile menu
        document.querySelector('.nav-menu').classList.remove('active');
        document.getElementById('navToggle').classList.remove('active');
    }

    // Task Management
    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');
        
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.currentTaskId = taskId;
                title.textContent = 'Edit Task';
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description;
                document.getElementById('taskDueDate').value = task.dueDate;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskCategory').value = task.category || '';
                document.getElementById('taskStatus').value = task.status;
            }
        } else {
            this.currentTaskId = null;
            title.textContent = 'Add New Task';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskForm').reset();
        this.currentTaskId = null;
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            status: document.getElementById('taskStatus').value
        };

        if (this.currentTaskId) {
            // Update existing task
            const index = this.tasks.findIndex(t => t.id === this.currentTaskId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData, updatedAt: new Date().toISOString() };
                this.showNotification('Task updated successfully!');
            }
        } else {
            // Add new task
            const newTask = {
                id: Date.now().toString(),
                ...taskData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.tasks.push(newTask);
            this.showNotification('Task added successfully!');
        }

        this.saveTasks();
        this.renderTasks();
        this.updateDashboard();
        this.closeTaskModal();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateDashboard();
            this.showNotification('Task deleted successfully!');
        }
    }

    toggleTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const statusFlow = {
                'todo': 'in-progress',
                'in-progress': 'completed',
                'completed': 'todo'
            };
            task.status = statusFlow[task.status];
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.updateDashboard();
            this.showNotification(`Task status changed to ${task.status}!`);
        }
    }

    // Category Management
    openCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        document.getElementById('categoryForm').reset();
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        
        const categoryData = {
            id: Date.now().toString(),
            name: document.getElementById('categoryName').value,
            color: document.getElementById('categoryColor').value,
            createdAt: new Date().toISOString()
        };

        this.categories.push(categoryData);
        this.saveCategories();
        this.renderCategories();
        this.updateCategorySelects();
        this.closeCategoryModal();
        this.showNotification('Category added successfully!');
    }

    deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category? Tasks in this category will not be deleted.')) {
            this.categories = this.categories.filter(c => c.id !== categoryId);
            // Update tasks to remove this category
            this.tasks.forEach(task => {
                if (task.category === categoryId) {
                    task.category = '';
                }
            });
            this.saveCategories();
            this.saveTasks();
            this.renderCategories();
            this.updateCategorySelects();
            this.renderTasks();
            this.showNotification('Category deleted successfully!');
        }
    }

    // Search and Filter
    handleSearch(e) {
        this.currentFilter.search = e.target.value.toLowerCase();
        this.renderTasks();
    }

    handleFilter(e) {
        this.currentFilter[e.target.id.replace('Filter', '')] = e.target.value;
        this.renderTasks();
    }

    getFilteredTasks() {
        return this.tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(this.currentFilter.search) ||
                                 task.description.toLowerCase().includes(this.currentFilter.search);
            const matchesStatus = this.currentFilter.status === 'all' || task.status === this.currentFilter.status;
            const matchesPriority = this.currentFilter.priority === 'all' || task.priority === this.currentFilter.priority;
            const matchesCategory = this.currentFilter.category === 'all' || task.category === this.currentFilter.category;
            
            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });
    }

    // Rendering
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const recentTasksList = document.getElementById('recentTasksList');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your filters or add a new task to get started.</p>
                </div>
            `;
        } else {
            tasksList.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');
        }

        // Render recent tasks (last 5)
        const recentTasks = [...this.tasks]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentTasks.length === 0) {
            recentTasksList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Create your first task!</p>
                </div>
            `;
        } else {
            recentTasksList.innerHTML = recentTasks.map(task => this.createTaskCard(task, true)).join('');
        }
    }

    createTaskCard(task, compact = false) {
        const category = this.categories.find(c => c.id === task.category);
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
        
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <div>
                        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        <div class="task-meta">
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                            <span class="task-status status-${task.status}">${task.status.replace('-', ' ')}</span>
                            ${category ? `<span class="task-category" style="background: ${category.color}20; color: ${category.color}">${category.name}</span>` : ''}
                            ${dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}"><i class="fas fa-calendar"></i> ${dueDate}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${task.description && !compact ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                <div class="task-actions">
                    <button onclick="taskManager.toggleTaskStatus('${task.id}')" title="Change Status">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button onclick="taskManager.openTaskModal('${task.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="taskManager.deleteTask('${task.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        
        if (this.categories.length === 0) {
            categoriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>No categories yet</h3>
                    <p>Create categories to organize your tasks better.</p>
                </div>
            `;
        } else {
            categoriesList.innerHTML = this.categories.map(category => {
                const taskCount = this.tasks.filter(t => t.category === category.id).length;
                return `
                    <div class="category-card" onclick="taskManager.deleteCategory('${category.id}')" title="Click to delete">
                        <div class="category-icon" style="background: ${category.color}">
                            <i class="fas fa-tag"></i>
                        </div>
                        <h3 class="category-name">${this.escapeHtml(category.name)}</h3>
                        <p class="category-count">${taskCount} task${taskCount !== 1 ? 's' : ''}</p>
                    </div>
                `;
            }).join('');
        }
    }

    updateCategorySelects() {
        const selects = [document.getElementById('taskCategory'), document.getElementById('categoryFilter')];
        
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">No Category</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                option.style.color = category.color;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    updateDashboard() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = this.tasks.filter(t => t.status === 'todo').length;
        const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress').length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('inProgressTasks').textContent = inProgressTasks;
        
        // Update progress bar
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('progressFill').style.width = `${progressPercentage}%`;
        document.getElementById('progressText').textContent = `${progressPercentage}%`;
    }

    // Data Management
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    loadDefaultCategories() {
        if (this.categories.length === 0) {
            this.categories = [
                { id: '1', name: 'Work', color: '#6366f1', createdAt: new Date().toISOString() },
                { id: '2', name: 'Personal', color: '#22c55e', createdAt: new Date().toISOString() },
                { id: '3', name: 'Shopping', color: '#f59e0b', createdAt: new Date().toISOString() }
            ];
            this.saveCategories();
        }
    }

    exportData() {
        const data = {
            tasks: this.tasks,
            categories: this.categories,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!');
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            if (confirm('This will delete all tasks and categories. Are you absolutely sure?')) {
                localStorage.removeItem('tasks');
                localStorage.removeItem('categories');
                this.tasks = [];
                this.categories = [];
                this.loadDefaultCategories();
                this.renderTasks();
                this.renderCategories();
                this.updateDashboard();
                this.updateCategorySelects();
                this.showNotification('All data cleared successfully!');
            }
        }
    }

    // Utilities
    showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
const taskManager = new TaskManager();

// Add some CSS for overdue tasks
const style = document.createElement('style');
style.textContent = `
    .task-due-date {
        font-size: 0.875rem;
        color: var(--text-secondary);
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .task-due-date.overdue {
        color: #dc2626;
        font-weight: 500;
    }
    
    .task-due-date i {
        font-size: 0.75rem;
    }
`;
document.head.appendChild(style);
