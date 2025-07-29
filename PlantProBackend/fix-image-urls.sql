-- Fix image URLs in health_logs table
-- Convert relative URLs to absolute URLs with proper API prefix

UPDATE health_logs
SET
    images = JSON_REPLACE(
        images,
        '$[0]',
        CASE
            WHEN JSON_EXTRACT(images, '$[0]') LIKE '/uploads/%' THEN CONCAT(
                'http://localhost:3000/api/v1',
                JSON_EXTRACT(images, '$[0]')
            )
            ELSE JSON_EXTRACT(images, '$[0]')
        END
    )
WHERE
    JSON_EXTRACT(images, '$[0]') IS NOT NULL
    AND JSON_EXTRACT(images, '$[0]') LIKE '/uploads/%';

-- Handle multiple images in array (up to 5 images as per controller limit)
UPDATE health_logs
SET
    images = JSON_REPLACE(
        images,
        '$[1]',
        CASE
            WHEN JSON_EXTRACT(images, '$[1]') LIKE '/uploads/%' THEN CONCAT(
                'http://localhost:3000/api/v1',
                JSON_EXTRACT(images, '$[1]')
            )
            ELSE JSON_EXTRACT(images, '$[1]')
        END
    )
WHERE
    JSON_EXTRACT(images, '$[1]') IS NOT NULL
    AND JSON_EXTRACT(images, '$[1]') LIKE '/uploads/%';

UPDATE health_logs
SET
    images = JSON_REPLACE(
        images,
        '$[2]',
        CASE
            WHEN JSON_EXTRACT(images, '$[2]') LIKE '/uploads/%' THEN CONCAT(
                'http://localhost:3000/api/v1',
                JSON_EXTRACT(images, '$[2]')
            )
            ELSE JSON_EXTRACT(images, '$[2]')
        END
    )
WHERE
    JSON_EXTRACT(images, '$[2]') IS NOT NULL
    AND JSON_EXTRACT(images, '$[2]') LIKE '/uploads/%';

UPDATE health_logs
SET
    images = JSON_REPLACE(
        images,
        '$[3]',
        CASE
            WHEN JSON_EXTRACT(images, '$[3]') LIKE '/uploads/%' THEN CONCAT(
                'http://localhost:3000/api/v1',
                JSON_EXTRACT(images, '$[3]')
            )
            ELSE JSON_EXTRACT(images, '$[3]')
        END
    )
WHERE
    JSON_EXTRACT(images, '$[3]') IS NOT NULL
    AND JSON_EXTRACT(images, '$[3]') LIKE '/uploads/%';

UPDATE health_logs
SET
    images = JSON_REPLACE(
        images,
        '$[4]',
        CASE
            WHEN JSON_EXTRACT(images, '$[4]') LIKE '/uploads/%' THEN CONCAT(
                'http://localhost:3000/api/v1',
                JSON_EXTRACT(images, '$[4]')
            )
            ELSE JSON_EXTRACT(images, '$[4]')
        END
    )
WHERE
    JSON_EXTRACT(images, '$[4]') IS NOT NULL
    AND JSON_EXTRACT(images, '$[4]') LIKE '/uploads/%';

-- Show the updated records
SELECT id, images
FROM health_logs
WHERE
    images IS NOT NULL
    AND images != '[]';