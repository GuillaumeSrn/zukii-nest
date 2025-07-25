-- Migration pour créer la table analysis_contents
-- À exécuter sur la base de données PostgreSQL

-- Créer la table analysis_contents
CREATE TABLE IF NOT EXISTS analysis_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    results JSONB,
    linked_file_ids TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les contraintes de validation
ALTER TABLE analysis_contents
ADD CONSTRAINT CHK_status_valid CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Ajouter les index pour les performances
CREATE INDEX IF NOT EXISTS IDX_analysis_contents_status ON analysis_contents (status);
CREATE INDEX IF NOT EXISTS IDX_analysis_contents_created_at ON analysis_contents (created_at);

-- Vérifier la création
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'analysis_contents'
ORDER BY ordinal_position; 