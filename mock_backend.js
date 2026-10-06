const http = require('http');

let users = [
    { id: 1, email: 'johndoe@test.com', password: 'Password123', firstName: 'John', lastName: 'Doe', role: 'CUSTOMER' },
    { id: 2, email: 'admin@duyanan.com', password: 'admin123', firstName: 'Admin', lastName: 'Duyanan', role: 'ADMIN' }
];

let reservations = [
    {
        id: 1,
        user: { id: 1, email: 'johndoe@test.com', firstName: 'John', lastName: 'Doe', role: 'CUSTOMER' },
        guestName: 'John Doe',
        contactNumber: '09171234567',
        reservationDate: '2026-08-20',
        reservationTime: '19:00:00',
        numberOfGuests: 4,
        status: 'PENDING',
        specialRequests: 'Window seat please',
        seatingType: 'indoor',
        eventType: 'Casual Dining',
        createdAt: new Date().toISOString()
    }
];

let products = [
    { id: 901, name: 'Classic Celebration Package', priceSolo: 12500.00, description: 'Perfect for small gatherings. Serves 20-25 pax. Includes 2 Main Dishes, 1 Side, and 1 Drink option.', category: 'Event Packages', imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500' },
    { id: 902, name: 'Grand Fiesta Package', priceSolo: 24900.00, description: 'Ideal for major milestones and corporate events. Serves 40-50 pax. Includes 3 Main Dishes, 2 Sides, and 2 Drink options.', category: 'Event Packages', imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500' },
    { id: 903, name: 'Royal Banquet Package', priceSolo: 48000.00, description: 'Exquisite premium catering package. Serves 80-100 pax. Includes 4 Main Dishes, 4 Sides, and 3 Drink options.', category: 'Event Packages', imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500' },
    
    // Menu items for customization
    { id: 101, name: 'Lechon Kawali Rice', category: 'Rice Meals' },
    { id: 102, name: 'Chicken Adobo Rice', category: 'Rice Meals' },
    { id: 201, name: 'Sizzling Sisig', category: 'Sizzling Meals' },
    { id: 202, name: 'Sizzling Bulalo', category: 'Sizzling Meals' },
    { id: 301, name: 'Kare-Kare', category: 'Duyanan Specials' },
    { id: 302, name: 'Crispy Pata', category: 'Duyanan Specials' },
    { id: 401, name: 'French Fries', category: 'French Fries' },
    { id: 402, name: 'Nachos', category: 'Nachos' },
    { id: 403, name: 'Pork Siomai', category: 'Home-Made Siomai' },
    { id: 404, name: 'Sinigang Soup', category: 'Soup' },
    { id: 405, name: 'Extra Rice', category: 'Extras' },
    { id: 406, name: 'Clubhouse Sandwich', category: 'Sandwich' },
    { id: 407, name: 'Burger with Fries', category: 'Student Meals' },
    { id: 501, name: 'Iced Tea', category: 'Drinks' },
    { id: 502, name: 'Coca Cola', category: 'Drinks' },
    { id: 503, name: 'Mango Shake', category: 'Milk Shakes' },
    { id: 504, name: 'Chocolate Shake', category: 'Milk Shakes' }
];

let events = [
    { id: 1, title: 'Wedding Reception', description: 'Exquisite banqueting services for weddings.', category: 'Catering', eventDate: '2026-08-30', imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500', createdAt: new Date().toISOString() },
    { id: 2, title: 'Birthday Bash', description: 'Fun themed birthday parties.', category: 'Socials', eventDate: '2026-09-15', imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500', createdAt: new Date().toISOString() }
];

const getRequestBody = (req) => {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve({});
            }
        });
    });
};

const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.end(JSON.stringify(data));
};

const getAuthenticatedUser = (req) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    return users.find(u => u.email === token) || null;
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        });
        res.end();
        return;
    }

    console.log(`${method} ${pathname}`);

    // Auth endpoints
    if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await getRequestBody(req);
        if (users.some(u => u.email === body.email)) {
            return sendJSON(res, 400, { error: 'Email is already taken!' });
        }
        const newUser = {
            id: users.length + 1,
            email: body.email,
            password: body.password,
            firstName: body.firstName,
            lastName: body.lastName,
            role: 'CUSTOMER'
        };
        users.push(newUser);
        return sendJSON(res, 200, { message: 'User registered successfully' });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await getRequestBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        if (!user) {
            return sendJSON(res, 401, { error: 'Invalid email or password' });
        }
        return sendJSON(res, 200, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            token: user.email
        });
    }

    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
        return sendJSON(res, 200, { message: 'If an account with that email exists, a new password has been sent.' });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
        const user = getAuthenticatedUser(req);
        if (!user) return sendJSON(res, 401, { error: 'Unauthorized' });
        return sendJSON(res, 200, {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    }

    // Public details
    if (pathname === '/api/products' && method === 'GET') {
        return sendJSON(res, 200, products);
    }

    if (pathname === '/api/events' && method === 'GET') {
        return sendJSON(res, 200, events);
    }

    // Reservations
    if (pathname === '/api/reservations' && method === 'POST') {
        const user = getAuthenticatedUser(req);
        if (!user) return sendJSON(res, 401, { error: 'Unauthorized access.' });

        const body = await getRequestBody(req);
        const guestCount = parseInt(body.numberOfGuests);
        if (isNaN(guestCount) || guestCount <= 0) {
            return sendJSON(res, 400, { error: 'Number of guests must be at least 1.' });
        }

        // Validate date
        const resDate = new Date(`${body.reservationDate}T${body.reservationTime}`);
        const now = new Date();
        if (resDate < now) {
            if (body.reservationDate < now.toISOString().split('T')[0]) {
                return sendJSON(res, 400, { error: 'Reservation date and time cannot be in the past!' });
            } else {
                return sendJSON(res, 400, { error: 'Reservation time cannot be in the past!' });
            }
        }

        // Check duplicate (ignore CANCELLED)
        const hasConflict = reservations.some(r => 
            r.user.id === user.id && 
            r.reservationDate === body.reservationDate && 
            r.reservationTime.startsWith(body.reservationTime) && 
            r.status !== 'CANCELLED'
        );
        if (hasConflict) {
            return sendJSON(res, 400, { error: 'Reservation time conflicts with another booking!' });
        }

        const newRes = {
            id: reservations.length + 1,
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
            guestName: body.guestName || `${user.firstName} ${user.lastName}`,
            contactNumber: body.contactNumber || '',
            reservationDate: body.reservationDate,
            reservationTime: body.reservationTime + ':00',
            numberOfGuests: guestCount,
            status: 'PENDING',
            specialRequests: body.specialRequests || '',
            seatingType: body.seatingType || 'indoor',
            eventType: body.eventType || 'Casual Dining',
            createdAt: new Date().toISOString()
        };
        reservations.push(newRes);
        return sendJSON(res, 200, newRes);
    }

    if (pathname === '/api/reservations/my-reservations' && method === 'GET') {
        const user = getAuthenticatedUser(req);
        if (!user) return sendJSON(res, 401, { error: 'Unauthorized' });
        const myRes = reservations.filter(r => r.user.id === user.id);
        return sendJSON(res, 200, myRes);
    }

    // specific reservation endpoints
    const resMatch = pathname.match(/^\/api\/reservations\/(\d+)$/);
    if (resMatch && method === 'GET') {
        const id = parseInt(resMatch[1]);
        const r = reservations.find(x => x.id === id);
        if (!r) return sendJSON(res, 404, { error: 'Not found' });
        return sendJSON(res, 200, r);
    }

    if (resMatch && method === 'PUT') {
        const id = parseInt(resMatch[1]);
        const r = reservations.find(x => x.id === id);
        if (!r) return sendJSON(res, 404, { error: 'Not found' });
        
        if (r.status !== 'PENDING') {
            return sendJSON(res, 400, { error: 'Only pending reservations can be modified.' });
        }

        const body = await getRequestBody(req);
        r.seatingType = body.seatingType || r.seatingType;
        r.reservationDate = body.reservationDate || r.reservationDate;
        r.reservationTime = (body.reservationTime ? body.reservationTime + ':00' : r.reservationTime);
        r.numberOfGuests = body.numberOfGuests ? parseInt(body.numberOfGuests) : r.numberOfGuests;

        return sendJSON(res, 200, r);
    }

    const cancelMatch = pathname.match(/^\/api\/reservations\/(\d+)\/cancel$/);
    if (cancelMatch && method === 'PUT') {
        const id = parseInt(cancelMatch[1]);
        const r = reservations.find(x => x.id === id);
        if (!r) return sendJSON(res, 404, { error: 'Not found' });

        if (r.status === 'COMPLETED') {
            return sendJSON(res, 400, { error: 'Completed reservations cannot be cancelled.' });
        }

        r.status = 'CANCELLED';
        return sendJSON(res, 200, r);
    }

    // Admin reservation actions
    if (pathname === '/api/admin/reservations' && method === 'GET') {
        const user = getAuthenticatedUser(req);
        if (!user || user.role !== 'ADMIN') {
            return sendJSON(res, 403, { error: 'Unauthorized access.' });
        }
        return sendJSON(res, 200, reservations);
    }

    const adminStatusMatch = pathname.match(/^\/api\/admin\/reservations\/(\d+)\/status$/);
    if (adminStatusMatch && method === 'PUT') {
        const user = getAuthenticatedUser(req);
        if (!user || user.role !== 'ADMIN') {
            return sendJSON(res, 403, { error: 'Unauthorized access.' });
        }

        const id = parseInt(adminStatusMatch[1]);
        const r = reservations.find(x => x.id === id);
        if (!r) return sendJSON(res, 404, { error: 'Not found' });

        const body = await getRequestBody(req);
        if (body.status === 'CANCELLED') {
            if (!body.cancellationReason || body.cancellationReason.trim() === '') {
                return sendJSON(res, 400, { error: 'Cancellation reason is required.' });
            }
            r.status = 'CANCELLED';
            r.cancellationReason = body.cancellationReason;
        } else {
            r.status = body.status;
        }

        return sendJSON(res, 200, r);
    }

    // Fallbacks for general admin tables
    if (pathname === '/api/admin/users' && method === 'GET') {
        return sendJSON(res, 200, users);
    }
    if (pathname === '/api/admin/products' && method === 'GET') {
        return sendJSON(res, 200, products);
    }
    if (pathname === '/api/admin/orders' && method === 'GET') {
        return sendJSON(res, 200, []);
    }
    if (pathname === '/api/admin/events' && method === 'GET') {
        return sendJSON(res, 200, events);
    }
    if (pathname === '/api/feedback' && method === 'GET') {
        return sendJSON(res, 200, []);
    }

    // Unknown endpoint
    return sendJSON(res, 404, { error: 'Not Found' });
});

server.listen(8080, () => {
    console.log('Mock server is listening on port 8080');
});
