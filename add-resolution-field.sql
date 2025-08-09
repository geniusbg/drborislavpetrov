-- Добавяне на поле resolution към bug_reports таблицата
-- Изпълнете тези команди като postgres администратор

-- Добавяне на поле resolution
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Добавяне на коментар за полето
COMMENT ON COLUMN bug_reports.resolution IS 'Описание на решението на проблема';

-- Проверка на структурата на таблицата
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bug_reports' 
ORDER BY ordinal_position; 