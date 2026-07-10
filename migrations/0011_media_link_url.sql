-- Adds support for a "link" media kind (a pasted reference URL, e.g.
-- YouTube/Vimeo, with no uploaded file) alongside existing image/video/audio
-- assets. link_url holds the URL for kind='link' rows; file_key stays NOT
-- NULL on the table but is stored as an empty string for these rows since
-- there's no R2 object to key against.
ALTER TABLE media_assets ADD COLUMN link_url TEXT;
