const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const db = new sqlite3.Database('database.db');

db.serialize(() => {
    console.log('Connecting to SQLite database');

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            total_score INTEGER DEFAULT 0
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users_roles (
        user_id TEXT,
        role_id INTEGER,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
    )`);

    db.run(`
        CREATE TABLE IF NOT EXISTS annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            image_id TEXT,
            annotations_data TEXT,
            metadata TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (image_id) REFERENCES images(id)
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS agencies (
        user_id TEXT PRIMARY KEY,
        agency_name TEXT NOT NULL,
        contact_info TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agency_id TEXT,
        name TEXT NOT NULL,
        rules TEXT,
        objective TEXT,
        description TEXT,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TEXT,
        FOREIGN KEY (agency_id) REFERENCES agencies(user_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS participant_contest (
        user_id TEXT,
        contest_id INTEGER,
        score INTEGER DEFAULT 0,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, contest_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (contest_id) REFERENCES contests(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contest_id INTEGER,
        dzi_url TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (contest_id) REFERENCES contests(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS validations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        annotation_id INTEGER,
        validator_id TEXT,
        decision TEXT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (annotation_id) REFERENCES annotations(id),
        FOREIGN KEY (validator_id) REFERENCES users(id)
    )`);

    const roles = ['explorer', 'agency', 'validator'];
    const stmt = db.prepare('INSERT OR IGNORE INTO roles (role_name) VALUES (?)');

    roles.forEach(role => {
        stmt.run(role);
    });

    stmt.finalize(async () => {
        console.log('Roles inserted successfully');
        const validatorId = 'validator-' + randomUUID();
        const validatorPassword = await bcrypt.hash('validator123', 10);
        
        db.get('SELECT id FROM users WHERE email = ?', ['validator@test.com'], (err, existingUser) => {
            if (!existingUser) {
                db.run(
                    'INSERT INTO users (id, name, email, password, total_score) VALUES (?, ?, ?, ?, ?)',
                    [validatorId, 'Test Validator', 'validator@test.com', validatorPassword, 500],
                    function(err) {
                        if (err) {
                            console.error('❌ Error inserting validator user:', err.message);
                            return;
                        }
                        
                        console.log('✅ Validator user created');
                        db.get('SELECT id FROM roles WHERE role_name = ?', ['validator'], (err, roleRow) => {
                            if (err || !roleRow) {
                                console.error('❌ Error retrieving validator role');
                                return;
                            }
                            
                            db.run(
                                'INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)',
                                [validatorId, roleRow.id],
                                function(err) {
                                    if (err) {
                                        console.error('❌ Error assigning role:', err.message);
                                        return;
                                    }
                                    
                                    console.log('✅ Validator role assigned');
                                    console.log('📝 Test user:');
                                    console.log('   Email: validator@test.com');
                                    console.log('   Password: validator123');
                                }
                            );
                        });
                    }
                );
            } else {
                console.log('ℹ️  Validator user already exists');
            }
        });
    });

    console.log('Tables created successfully');
});

module.exports = db; 