const express = require("express");
const cors = require("cors");
const db = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");

const app = express();
const port = 3000; 
const JWT_SECRET = "Hugo animal";

app.use(cors());
app.use(express.json());

// Middleware to verify the token and role
const verifyTokenAndRole = (allowedRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Acceso denegado. Token no proporcionado" });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Token inválido" });
            }

            const sql = `
                SELECT r.role_name FROM users_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ?
            `;

            db.get(sql, [decoded.userId], (err, row) => {
                if (err || !row || !allowedRoles.includes(row.role_name)) {
                    return res.status(403).json({ error: "Acceso denegado. Rol no permitido" });
                }

                req.user = decoded;
                next();
            });
        });
    }
};

// AUTHENTICATION ROUTES

// 1.Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role = 'participant' } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const sqlGetRole = 'SELECT id FROM roles WHERE role_name = ?';
    db.get(sqlGetRole, [role], async (err, roleRow) => {
        if (err || !roleRow) {
            return res.status(400).json({ error: "Rol no encontrado" });
        }

        const role_id = roleRow.id;
        const hashedPassword = await bcrypt.hash(password, 10);
        const id_user = randomUUID();

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const sqlInsertUser = 'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)';
            db.run(sqlInsertUser, [id_user, name, email, hashedPassword], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: "Error al registrar el usuario" });
                }

                const sqlInsertUserRole = 'INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)';
                db.run(sqlInsertUserRole, [id_user, role_id], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: "Error al registrar el usuario" });
                    }

                    db.run('COMMIT');
                    res.status(201).json({ message: "Usuario registrado correctamente", userId: id_user, role: role });
                });
            });
            
        });
    })
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const sql = `
        SELECT u.*, r.role_name as role
        FROM users u
        LEFT JOIN users_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = ?
    `;

    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener el usuario" });
        }
        if (!user) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        
        // Devolver token y datos del usuario
        res.json({ 
            message: 'Login exitoso', 
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'participant',
                score: user.total_score || 0
            }
        });
    });
});

// APP ROUTES

// 3. Save Annotation (Protected - requires authentication)
app.post('/api/annotations', verifyTokenAndRole(['participant', 'validator', 'agency']), async (req, res) => {
    const user_id = req.user.userId; // Extraer del token (más seguro)
    const { image_id, annotations, metadata } = req.body;

    if (!image_id || !annotations) {
        return res.status(400).json({ error: "image_id y annotations son requeridos" });
    }

    const sql = 'INSERT INTO annotations (user_id, image_id, annotations_data, metadata, status) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [user_id, image_id, JSON.stringify(annotations), JSON.stringify(metadata), 'pending'], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error al guardar la anotación", details: err.message });
        }

        const annotation_id = this.lastID;

        // Update total score (+10 puntos por anotación)
        db.run('UPDATE users SET total_score = total_score + 10 WHERE id = ?', [user_id]);

        // Check for auto-promotion to validator (20+ annotations)
        const countSql = 'SELECT COUNT(*) as count FROM annotations WHERE user_id = ?';
        db.get(countSql, [user_id], (err, row) => {
            if (err) {
                return res.status(201).json({ 
                    message: "Anotación guardada correctamente", 
                    annotation_id: annotation_id 
                });
            }

            const annotationCount = row.count;
            
            // Check current role
            const roleSql = `
                SELECT r.role_name 
                FROM users_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ?
            `;

            db.get(roleSql, [user_id], (err, roleRow) => {
                if (err || !roleRow) {
                    return res.status(201).json({ 
                        message: "Anotación guardada correctamente", 
                        annotation_id: annotation_id 
                    });
                }

                // Promote to validator if >= 5 annotations and still participant
                if (annotationCount >= 20 && roleRow.role_name === 'participant') {
                    // Get validator role id
                    db.get('SELECT id FROM roles WHERE role_name = ?', ['validator'], (err, validatorRole) => {
                        if (err || !validatorRole) {
                            return res.status(201).json({ 
                                message: "Anotación guardada correctamente", 
                                annotation_id: annotation_id 
                            });
                        }

                        // Update user role to validator
                        db.run('UPDATE users_roles SET role_id = ? WHERE user_id = ?', 
                            [validatorRole.id, user_id], 
                            (err) => {
                                if (err) {
                                    return res.status(201).json({ 
                                        message: "Anotación guardada correctamente", 
                                        annotation_id: annotation_id 
                                    });
                                }

                                // Give bonus points for promotion (+500)
                                db.run('UPDATE users SET total_score = total_score + 500 WHERE id = ?', [user_id]);

                                res.status(201).json({ 
                                    message: "Anotación guardada correctamente", 
                                    annotation_id: annotation_id,
                                    promoted: true,
                                    new_role: 'validator',
                                    bonus_points: 500,
                                    annotations_count: annotationCount
                                });
                            }
                        );
                    });
                } else {
                    res.status(201).json({ 
                        message: "Anotación guardada correctamente", 
                        annotation_id: annotation_id,
                        annotations_count: annotationCount
                    });
                }
            });
        });
    });
});

// 4. Get all contests (public for all users)
app.get('/api/contests', async (req, res) => {
    const sql = 'SELECT * FROM contests';
    db.all(sql, [], (err, contests) => {
        if (err) {
            console.error('❌ Error al obtener contests:', err.message);
            return res.status(500).json({ error: "Error al obtener los concursos", details: err.message });
        }

        if (!contests || contests.length === 0) {
            return res.json([]);
        }

        // Obtener imágenes para cada contest
        let processed = 0;
        const contestsWithImages = [];

        contests.forEach(contest => {
            const imagesSql = 'SELECT id, dzi_url, metadata FROM images WHERE contest_id = ?';
            
            db.all(imagesSql, [contest.id], (err, images) => {
                processed++;
                
                if (err) {
                    console.error(`❌ Error obteniendo imágenes del contest ${contest.id}:`, err.message);
                    contestsWithImages.push({
                        ...contest,
                        images: []
                    });
                } else {
                    contestsWithImages.push({
                        ...contest,
                        images: images || []
                    });
                }

                // Cuando todos los contests han sido procesados
                if (processed === contests.length) {
                    console.log(`✅ Devolviendo ${contestsWithImages.length} contests con imágenes`);
                    res.json(contestsWithImages);
                }
            });
        });
    });
});

// 5. Create a new contests with images (Only for agencies) - TODO EN UNO
app.post('/api/contests', verifyTokenAndRole(['agency']), async (req, res) => {
    const { name, rules, objective, description, end_date, images } = req.body;
    const agency_id = req.user.userId;

    console.log('📝 Creando contest:', { name, agency_id, images_count: images?.length });

    if (!name) {
        return res.status(400).json({ error: "El nombre del concurso es requerido" });
    }

    const contestSql = 'INSERT INTO contests (agency_id, name, rules, objective, description, end_date) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(contestSql, [agency_id, name, rules, objective, description, end_date], function(err) {
        if (err) {
            console.error('❌ Error al crear contest:', err.message);
            return res.status(500).json({ error: "Error al crear el concurso", details: err.message });
        }

        const contest_id = this.lastID;
        console.log('✅ Contest creado con ID:', contest_id);

        // Si hay imágenes, insertarlas automáticamente
        if (images && Array.isArray(images) && images.length > 0) {
            console.log('🖼️ Insertando', images.length, 'imágenes...');
            
            const stmt = db.prepare('INSERT INTO images (contest_id, dzi_url, metadata) VALUES (?, ?, ?)');
            
            let inserted = 0;
            let errors = [];
            let processed = 0;

            images.forEach((img, index) => {
                const metadata = typeof img.metadata === 'string' 
                    ? img.metadata 
                    : JSON.stringify(img.metadata || {});
                
                stmt.run([contest_id, img.dzi_url || img.url, metadata], function(err) {
                    processed++;
                    
                    if (err) {
                        console.error(`❌ Error insertando imagen ${index}:`, err.message);
                        errors.push(err.message);
                    } else {
                        inserted++;
                        console.log(`✅ Imagen ${index} insertada con ID:`, this.lastID);
                    }

                    // Cuando todas las imágenes han sido procesadas
                    if (processed === images.length) {
                        stmt.finalize((finalizeErr) => {
                            if (finalizeErr) {
                                console.error('❌ Error en finalize:', finalizeErr.message);
                                return res.status(500).json({ 
                                    error: "Error finalizando inserción de imágenes", 
                                    details: finalizeErr.message 
                                });
                            }

                            console.log(`✅ Total insertado: ${inserted}/${images.length}`);
                            res.status(201).json({ 
                                message: "Concurso creado correctamente con imágenes", 
                                contest_id: contest_id,
                                images_added: inserted,
                                errors: errors.length > 0 ? errors : undefined
                            });
                        });
                    }
                });
            });
        } else {
            // Sin imágenes
            console.log('ℹ️ Contest creado sin imágenes');
            res.status(201).json({ 
                message: "Concurso creado correctamente", 
                contest_id: contest_id,
                images_added: 0
            });
        }
    });
});

// 6. Join a contests (Only for participants)
app.post('/api/contests/:id/join', verifyTokenAndRole(['participant']), async (req, res) => {
    const contest_id = req.params.id;
    const user_id = req.user.userId;

    const sql = 'INSERT INTO participant_contest (user_id, contest_id) VALUES (?, ?)';
    db.run(sql, [user_id, contest_id], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error al unirse al concurso", error: err.message });
        }
        res.status(201).json({ message: "Te has unido al concurso correctamente" });
    });
});

// 7. Get images from a contest (User has to be logged in)
app.get('/api/contests/:id/images', verifyTokenAndRole(['participant', 'agency', 'validator']),  (req, res) => {
    const contest_id = req.params.id;

    const sql = 'SELECT id, dzi_url, metadata FROM images WHERE contest_id = ?';

    db.all(sql, [contest_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener las imágenes", details: err.message });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "No se encontraron imágenes para este concurso" });
        }

        res.json(rows);
    });
});

// 8. Get current user profile (requires authentication) - Enhanced with statistics
app.get('/api/users/me', verifyTokenAndRole(['participant', 'agency', 'validator']), async (req, res) => {
    const userId = req.user.userId;

    const sql = `
        SELECT u.id, u.name, u.email, u.total_score, r.role_name as role
        FROM users u
        JOIN users_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ?
    `;

    db.get(sql, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener el usuario" });
        }
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Get annotations count
        const countSql = 'SELECT COUNT(*) as count FROM annotations WHERE user_id = ?';
        db.get(countSql, [userId], (err, countRow) => {
            const annotations_count = countRow ? countRow.count : 0;

            // Get validated annotations count
            const validatedSql = `
                SELECT COUNT(*) as count 
                FROM annotations 
                WHERE user_id = ? AND status = 'validated'
            `;
            db.get(validatedSql, [userId], (err, validatedRow) => {
                const validated_count = validatedRow ? validatedRow.count : 0;

                // Get user rank
                const rankSql = `
                    SELECT COUNT(*) + 1 as rank
                    FROM users
                    WHERE total_score > (SELECT total_score FROM users WHERE id = ?)
                `;
                db.get(rankSql, [userId], (err, rankRow) => {
                    const rank = rankRow ? rankRow.rank : 0;

                    res.json({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        score: user.total_score,
                        annotations_count: annotations_count,
                        validated_annotations: validated_count,
                        rank: rank
                    });
                });
            });
        });
    });
});


// 9. Get specific contest with images
app.get('/api/contests/:id', async (req, res) => {
    const contest_id = req.params.id;

    const contestSql = 'SELECT * FROM contests WHERE id = ?';
    db.get(contestSql, [contest_id], (err, contest) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener el concurso" });
        }
        if (!contest) {
            return res.status(404).json({ error: "Concurso no encontrado" });
        }

        // Get images for this contest (directo, sin datasets)
        const imagesSql = 'SELECT id, dzi_url, metadata FROM images WHERE contest_id = ?';

        db.all(imagesSql, [contest_id], (err, images) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener las imágenes" });
            }

            res.json({
                ...contest,
                images: images || []
            });
        });
    });
});

// 10. Get annotations (with filters)
app.get('/api/annotations', verifyTokenAndRole(['participant', 'agency', 'validator']), async (req, res) => {
    const { contest_id, status, user_id } = req.query;
    
    let sql = `
        SELECT 
            a.*, 
            u.name as user_name,
            i.dzi_url,
            i.contest_id
        FROM annotations a 
        JOIN users u ON a.user_id = u.id
        LEFT JOIN images i ON a.image_id = i.id
        WHERE 1=1
    `;
    const params = [];

    if (contest_id) {
        sql += ' AND i.contest_id = ?';
        params.push(contest_id);
    }

    if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
    }

    if (user_id) {
        sql += ' AND a.user_id = ?';
        params.push(user_id);
    }

    sql += ' ORDER BY a.created_at DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener las anotaciones", details: err.message });
        }

        // Parse JSON fields
        const annotations = rows.map(row => ({
            ...row,
            annotations_data: row.annotations_data ? JSON.parse(row.annotations_data) : null,
            metadata: row.metadata ? JSON.parse(row.metadata) : null
        }));

        res.json(annotations);
    });
});

// 11. Validate an annotation (validators and agencies only)
app.post('/api/annotations/:id/validate', verifyTokenAndRole(['validator', 'agency']), async (req, res) => {
    const annotation_id = req.params.id;
    const validator_id = req.user.userId;
    const { decision, comment = '' } = req.body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: "decision debe ser 'approved' o 'rejected'" });
    }

    // Check if annotation exists
    const checkSql = 'SELECT * FROM annotations WHERE id = ?';
    db.get(checkSql, [annotation_id], (err, annotation) => {
        if (err || !annotation) {
            return res.status(404).json({ error: "Anotación no encontrada" });
        }

        // Insert validation record
        const validationSql = 'INSERT INTO validations (annotation_id, validator_id, decision, comment) VALUES (?, ?, ?, ?)';
        db.run(validationSql, [annotation_id, validator_id, decision, comment], function(err) {
            if (err) {
                return res.status(500).json({ error: "Error al guardar la validación", details: err.message });
            }

            // Update annotation status
            const newStatus = decision === 'approved' ? 'validated' : 'rejected';
            db.run('UPDATE annotations SET status = ? WHERE id = ?', [newStatus, annotation_id]);

            // Give points to user if approved (+100)
            if (decision === 'approved') {
                db.run('UPDATE users SET total_score = total_score + 100 WHERE id = ?', [annotation.user_id]);
            }

            res.json({ 
                message: "Validación guardada correctamente", 
                validation_id: this.lastID,
                decision: decision,
                points_awarded: decision === 'approved' ? 100 : 0
            });
        });
    });
});

// 12. Get global ranking
app.get('/api/ranking', async (req, res) => {
    const limit = req.query.limit || 10;

    const sql = `
        SELECT 
            u.id,
            u.name,
            u.total_score as score,
            r.role_name as role,
            COUNT(a.id) as annotations_count,
            RANK() OVER (ORDER BY u.total_score DESC) as rank
        FROM users u
        LEFT JOIN annotations a ON u.id = a.user_id
        LEFT JOIN users_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        GROUP BY u.id
        ORDER BY u.total_score DESC
        LIMIT ?
    `;

    db.all(sql, [parseInt(limit)], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener el ranking", details: err.message });
        }

        res.json(rows);
    });
});

// ELIMINADO: Las imágenes ahora se crean junto con el contest en POST /api/contests

// 15. Alias endpoints for frontend compatibility (challenges = contests)
app.get('/api/challenges', (req, res) => {
    req.url = '/api/contests';
    app._router.handle(req, res);
});

app.post('/api/challenges', verifyTokenAndRole(['agency']), (req, res) => {
    req.url = '/api/contests';
    app._router.handle(req, res);
});

app.get('/api/challenges/:id', (req, res) => {
    req.url = `/api/contests/${req.params.id}`;
    app._router.handle(req, res);
});


// DEBUG: Ver todos los usuarios (temporal)
app.get('/api/debug/users', (req, res) => {
    const sql = `
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            r.role_name as role,
            u.total_score
        FROM users u
        LEFT JOIN users_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ total: rows.length, users: rows });
    });
});

// DEBUG: Ver todos los contests (temporal)
app.get('/api/debug/contests', (req, res) => {
    const sql = `
        SELECT * FROM contests
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ total: rows.length, contests: rows });
    });
});

app.get('/api/debug/images', (req, res) => {
    const sql = 'SELECT * FROM images';

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ total: rows.length, images: rows });
    });
});

app.get('/api/debug/annotations', (req, res) => {
    const sql = 'SELECT * FROM annotations';

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ total: rows.length, annotations: rows });
    });
});

app.get('/', (req, res) => {
    res.send('¡El servidor está funcionando!');
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});