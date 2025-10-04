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
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const verifyTokenAndRole = (allowedRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Access denied. Token not provided" });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Invalid token" });
            }

            const sql = `
                SELECT r.role_name FROM users_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ?
            `;

            db.get(sql, [decoded.userId], (err, row) => {
                if (err || !row || !allowedRoles.includes(row.role_name)) {
                    return res.status(403).json({ error: "Access denied. Role not allowed" });
                }

                req.user = decoded;
                next();
            });
        });
    }
};

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role = 'participant' } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const sqlGetRole = 'SELECT id FROM roles WHERE role_name = ?';
    db.get(sqlGetRole, [role], async (err, roleRow) => {
        if (err || !roleRow) {
            return res.status(400).json({ error: "Role not found" });
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
                    return res.status(500).json({ error: "Error registering user" });
                }

                const sqlInsertUserRole = 'INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)';
                db.run(sqlInsertUserRole, [id_user, role_id], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: "Error registering user" });
                    }

                    db.run('COMMIT');
                    res.status(201).json({ message: "User registered successfully", userId: id_user, role: role });
                });
            });
            
        });
    })
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
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
            return res.status(500).json({ error: "Error retrieving user" });
        }
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ 
            message: 'Login successful', 
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

app.post('/api/annotations', verifyTokenAndRole(['participant', 'validator', 'agency']), async (req, res) => {
    const user_id = req.user.userId;
    const { image_id, annotations, metadata } = req.body;

    if (!image_id || !annotations) {
        return res.status(400).json({ error: "image_id and annotations are required" });
    }

    const sql = 'INSERT INTO annotations (user_id, image_id, annotations_data, metadata, status) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [user_id, image_id, JSON.stringify(annotations), JSON.stringify(metadata), 'pending'], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error saving annotation", details: err.message });
        }

        const annotation_id = this.lastID;

        db.run('UPDATE users SET total_score = total_score + 10 WHERE id = ?', [user_id]);
        const countSql = 'SELECT COUNT(*) as count FROM annotations WHERE user_id = ?';
        db.get(countSql, [user_id], (err, row) => {
            if (err) {
                return res.status(201).json({ 
                    message: "Annotation saved successfully", 
                    annotation_id: annotation_id 
                });
            }

            const annotationCount = row.count;
            const roleSql = `
                SELECT r.role_name 
                FROM users_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ?
            `;

            db.get(roleSql, [user_id], (err, roleRow) => {
                if (err || !roleRow) {
                    return res.status(201).json({ 
                        message: "Annotation saved successfully", 
                        annotation_id: annotation_id 
                    });
                }
                if (annotationCount >= 20 && roleRow.role_name === 'participant') {
                    db.get('SELECT id FROM roles WHERE role_name = ?', ['validator'], (err, validatorRole) => {
                        if (err || !validatorRole) {
                            return res.status(201).json({ 
                                message: "Annotation saved successfully", 
                                annotation_id: annotation_id 
                            });
                        }
                        db.run('UPDATE users_roles SET role_id = ? WHERE user_id = ?', 
                            [validatorRole.id, user_id], 
                            (err) => {
                                if (err) {
                                    return res.status(201).json({ 
                                        message: "Annotation saved successfully", 
                                        annotation_id: annotation_id 
                                    });
                                }

                                db.run('UPDATE users SET total_score = total_score + 500 WHERE id = ?', [user_id]);

                                res.status(201).json({ 
                                    message: "Annotation saved successfully", 
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
                        message: "Annotation saved successfully", 
                        annotation_id: annotation_id,
                        annotations_count: annotationCount
                    });
                }
            });
        });
    });
});

app.get('/api/contests', async (req, res) => {
    const sql = 'SELECT * FROM contests';
    db.all(sql, [], (err, contests) => {
        if (err) {
            console.error('❌ Error retrieving contests:', err.message);
            return res.status(500).json({ error: "Error retrieving contests", details: err.message });
        }

        if (!contests || contests.length === 0) {
            return res.json([]);
        }

        let processed = 0;
        const contestsWithImages = [];

        contests.forEach(contest => {
            const imagesSql = 'SELECT id, dzi_url, metadata FROM images WHERE contest_id = ?';
            
            db.all(imagesSql, [contest.id], (err, images) => {
                processed++;
                
                if (err) {
                    console.error(`❌ Error retrieving images for contest ${contest.id}:`, err.message);
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
                if (processed === contests.length) {
                    console.log(`✅ Returning ${contestsWithImages.length} contests with images`);
                    res.json(contestsWithImages);
                }
            });
        });
    });
});

app.post('/api/contests', verifyTokenAndRole(['agency']), async (req, res) => {
    const { name, rules, objective, description, end_date, images } = req.body;
    const agency_id = req.user.userId;

    console.log('📝 Creating contest:', { name, agency_id, images_count: images?.length });

    if (!name) {
        return res.status(400).json({ error: "Contest name is required" });
    }

    const contestSql = 'INSERT INTO contests (agency_id, name, rules, objective, description, end_date) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(contestSql, [agency_id, name, rules, objective, description, end_date], function(err) {
        if (err) {
            console.error('❌ Error creating contest:', err.message);
            return res.status(500).json({ error: "Error creating contest", details: err.message });
        }

        const contest_id = this.lastID;
        console.log('✅ Contest created with ID:', contest_id);

        if (images && Array.isArray(images) && images.length > 0) {
            console.log('🖼️ Inserting', images.length, 'images...');
            
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
                        console.error(`❌ Error inserting image ${index}:`, err.message);
                        errors.push(err.message);
                    } else {
                        inserted++;
                        console.log(`✅ Image ${index} inserted with ID:`, this.lastID);
                    }
                    if (processed === images.length) {
                        stmt.finalize((finalizeErr) => {
                            if (finalizeErr) {
                                console.error('❌ Error in finalize:', finalizeErr.message);
                                return res.status(500).json({ 
                                    error: "Error finalizing image insertion", 
                                    details: finalizeErr.message 
                                });
                            }

                            console.log(`✅ Total inserted: ${inserted}/${images.length}`);
                            res.status(201).json({ 
                                message: "Contest created successfully with images", 
                                contest_id: contest_id,
                                images_added: inserted,
                                errors: errors.length > 0 ? errors : undefined
                            });
                        });
                    }
                });
            });
        } else {
            console.log('ℹ️ Contest created without images');
            res.status(201).json({ 
                message: "Contest created successfully", 
                contest_id: contest_id,
                images_added: 0
            });
        }
    });
});

app.post('/api/contests/:id/join', verifyTokenAndRole(['participant']), async (req, res) => {
    const contest_id = req.params.id;
    const user_id = req.user.userId;

    const sql = 'INSERT INTO participant_contest (user_id, contest_id) VALUES (?, ?)';
    db.run(sql, [user_id, contest_id], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error joining contest", error: err.message });
        }
        res.status(201).json({ message: "Successfully joined contest" });
    });
});

app.get('/api/contests/:id/images', verifyTokenAndRole(['participant', 'agency', 'validator']),  (req, res) => {
    const contest_id = req.params.id;

    const sql = 'SELECT id, dzi_url, metadata FROM images WHERE contest_id = ?';

    db.all(sql, [contest_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error retrieving images", details: err.message });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "No images found for this contest" });
        }

        res.json(rows);
    });
});

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
            return res.status(500).json({ error: "Error retrieving user" });
        }
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const countSql = 'SELECT COUNT(*) as count FROM annotations WHERE user_id = ?';
        db.get(countSql, [userId], (err, countRow) => {
            const annotations_count = countRow ? countRow.count : 0;
            const validatedSql = `
                SELECT COUNT(*) as count 
                FROM annotations 
                WHERE user_id = ? AND status = 'validated'
            `;
            db.get(validatedSql, [userId], (err, validatedRow) => {
                const validated_count = validatedRow ? validatedRow.count : 0;
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

app.get('/api/contests/:id', async (req, res) => {
    const contest_id = req.params.id;

    const contestSql = 'SELECT * FROM contests WHERE id = ?';
    db.get(contestSql, [contest_id], (err, contest) => {
        if (err) {
            return res.status(500).json({ error: "Error retrieving contest" });
        }
        if (!contest) {
            return res.status(404).json({ error: "Contest not found" });
        }
        const imagesSql = 'SELECT id, dzi_url, metadata FROM images WHERE contest_id = ?';

        db.all(imagesSql, [contest_id], (err, images) => {
            if (err) {
                return res.status(500).json({ error: "Error retrieving images" });
            }

            res.json({
                ...contest,
                images: images || []
            });
        });
    });
});

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
            return res.status(500).json({ error: "Error retrieving annotations", details: err.message });
        }
        const annotations = rows.map(row => ({
            ...row,
            annotations_data: row.annotations_data ? JSON.parse(row.annotations_data) : null,
            metadata: row.metadata ? JSON.parse(row.metadata) : null
        }));

        res.json(annotations);
    });
});

app.post('/api/annotations/:id/validate', verifyTokenAndRole(['validator', 'agency']), async (req, res) => {
    const annotation_id = req.params.id;
    const validator_id = req.user.userId;
    const { decision, comment = '' } = req.body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    }
    const checkSql = 'SELECT * FROM annotations WHERE id = ?';
    db.get(checkSql, [annotation_id], (err, annotation) => {
        if (err || !annotation) {
            return res.status(404).json({ error: "Annotation not found" });
        }
        const validationSql = 'INSERT INTO validations (annotation_id, validator_id, decision, comment) VALUES (?, ?, ?, ?)';
        db.run(validationSql, [annotation_id, validator_id, decision, comment], function(err) {
            if (err) {
                return res.status(500).json({ error: "Error saving validation", details: err.message });
            }

            const newStatus = decision === 'approved' ? 'validated' : 'rejected';
            db.run('UPDATE annotations SET status = ? WHERE id = ?', [newStatus, annotation_id]);
            if (decision === 'approved') {
                db.run('UPDATE users SET total_score = total_score + 100 WHERE id = ?', [annotation.user_id]);
            }

            res.json({ 
                message: "Validation saved successfully", 
                validation_id: this.lastID,
                decision: decision,
                points_awarded: decision === 'approved' ? 100 : 0
            });
        });
    });
});

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
            return res.status(500).json({ error: "Error retrieving ranking", details: err.message });
        }

        res.json(rows);
    });
});
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
    res.send('Server is running!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});