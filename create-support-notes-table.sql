-- Create support_notes table
CREATE TABLE IF NOT EXISTS support_notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_by VARCHAR(100) NOT NULL DEFAULT 'Super Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_support_notes_status ON support_notes(status);
CREATE INDEX IF NOT EXISTS idx_support_notes_created_at ON support_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_support_notes_type ON support_notes(type);
CREATE INDEX IF NOT EXISTS idx_support_notes_priority ON support_notes(priority);

-- Insert some sample data
INSERT INTO support_notes (title, description, type, priority, status, created_by) VALUES
('Проблем с календара', 'Календарът не показва правилно резервациите за следващия месец', 'bug', 'high', 'open', 'Super Admin'),
('Добавяне на SMS известия', 'Искаме да добавим SMS известия за потвърждение на резервации', 'feature', 'medium', 'open', 'Super Admin'),
('Подобряване на мобилния интерфейс', 'Трябва да подобрим изгледа на сайта на мобилни устройства', 'improvement', 'low', 'in_progress', 'Super Admin'),
('Проблем с вход в админ панела', 'Понякога не може да се влезе в админ панела', 'bug', 'urgent', 'resolved', 'Super Admin'),
('Добавяне на експорт на данни', 'Искаме да можем да експортираме резервациите в Excel', 'feature', 'medium', 'open', 'Super Admin');

COMMIT; 