const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Book = require('../src/models/Book');
const { connectDB, disconnectDB, clearDB } = require('../src/config/database');

// Test database setup
const setupTestDB = async () => {
  const mongoURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/library_management_test';
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Test data
const validBookData = {
  title: 'Test Book',
  author: 'Test Author',
  year: 2023,
  genre: 'Fiction',
  description: 'A test book for unit testing',
  isbn: '978-0123456789'
};

const invalidBookData = {
  title: '', // Empty title - should fail validation
  author: 'Test Author',
  year: 'invalid-year' // Invalid year - should fail validation
};

describe('Library Management API', () => {
  let bookId;

  // Setup before all tests
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await setupTestDB();
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  // Clean database before each test
  beforeEach(async () => {
    await Book.deleteMany({});
  });

  describe('API Health and Info', () => {
    describe('GET /', () => {
      it('should return API welcome message', async () => {
        const res = await request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Welcome to Library Management API');
        expect(res.body.version).toBe('1.0.0');
      });
    });

    describe('GET /api/health', () => {
      it('should return API health status', async () => {
        const res = await request(app)
          .get('/api/health')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Library Management API is running smoothly');
        expect(res.body).toHaveProperty('system');
        expect(res.body).toHaveProperty('database');
        expect(res.body).toHaveProperty('api');
      });
    });

    describe('GET /api/docs', () => {
      it('should return API documentation', async () => {
        const res = await request(app)
          .get('/api/docs')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.title).toBe('Library Management API Documentation');
        expect(res.body).toHaveProperty('endpoints');
        expect(res.body.endpoints).toHaveProperty('books');
      });
    });

    describe('GET /info', () => {
      it('should return API information', async () => {
        const res = await request(app)
          .get('/info')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.api.name).toBe('Library Management API');
        expect(res.body).toHaveProperty('endpoints');
      });
    });
  });

  describe('Book CRUD Operations', () => {
    describe('POST /api/books', () => {
      it('should create a new book with valid data', async () => {
        const res = await request(app)
          .post('/api/books')
          .send(validBookData)
          .expect('Content-Type', /json/)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Book created successfully');
        expect(res.body.data.title).toBe(validBookData.title);
        expect(res.body.data.author).toBe(validBookData.author);
        expect(res.body.data.year).toBe(validBookData.year);
        expect(res.body.data).toHaveProperty('_id');

        // Store book ID for other tests
        bookId = res.body.data._id;
      });

      it('should create a book with minimal required data', async () => {
        const minimalData = {
          title: 'Minimal Book',
          author: 'Minimal Author',
          year: 2022
        };

        const res = await request(app)
          .post('/api/books')
          .send(minimalData)
          .expect('Content-Type', /json/)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(minimalData.title);
        expect(res.body.data.available).toBe(true); // Default value
      });

      it('should return validation error for invalid data', async () => {
        const res = await request(app)
          .post('/api/books')
          .send(invalidBookData)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
      });

      it('should return validation error for missing required fields', async () => {
        const incompleteData = {
          title: 'Incomplete Book'
          // Missing author and year
        };

        const res = await request(app)
          .post('/api/books')
          .send(incompleteData)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Validation failed');
      });

      it('should return error for duplicate ISBN', async () => {
        // Create first book
        await Book.create(validBookData);

        // Try to create another book with same ISBN
        const res = await request(app)
          .post('/api/books')
          .send(validBookData)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('already exists');
      });
    });

    describe('GET /api/books', () => {
      beforeEach(async () => {
        // Create test books
        await Book.create([
          {
            title: 'Book 1',
            author: 'Author 1',
            year: 2021,
            genre: 'Fiction'
          },
          {
            title: 'Book 2',
            author: 'Author 2',
            year: 2022,
            genre: 'Non-Fiction'
          },
          {
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            year: 1925,
            genre: 'Fiction'
          }
        ]);
      });

      it('should get all books', async () => {
        const res = await request(app)
          .get('/api/books')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(3);
        expect(res.body.total).toBe(3);
        expect(res.body.data).toHaveLength(3);
        expect(res.body).toHaveProperty('pagination');
      });

      it('should support pagination', async () => {
        const res = await request(app)
          .get('/api/books?page=1&limit=2')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.total).toBe(3);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(2);
        expect(res.body.pagination.hasNextPage).toBe(true);
      });

      it('should support search functionality', async () => {
        const res = await request(app)
          .get('/api/books?search=Gatsby')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].title).toBe('The Great Gatsby');
      });

      it('should filter books by genre', async () => {
        const res = await request(app)
          .get('/api/books?genre=fiction')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.data.every(book => book.genre === 'Fiction')).toBe(true);
      });

      it('should filter books by year', async () => {
        const res = await request(app)
          .get('/api/books?year=2021')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].year).toBe(2021);
      });

      it('should support multiple filters', async () => {
        const res = await request(app)
          .get('/api/books?genre=fiction&year=1925')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].title).toBe('The Great Gatsby');
      });
    });

    describe('GET /api/books/:id', () => {
      beforeEach(async () => {
        const book = await Book.create(validBookData);
        bookId = book._id.toString();
      });

      it('should get a single book by ID', async () => {
        const res = await request(app)
          .get(`/api/books/${bookId}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data._id).toBe(bookId);
        expect(res.body.data.title).toBe(validBookData.title);
      });

      it('should return 404 for non-existent book', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .get(`/api/books/${nonExistentId}`)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Book not found');
      });

      it('should return 400 for invalid ID format', async () => {
        const res = await request(app)
          .get('/api/books/invalid-id')
          .expect('Content-Type', /json/)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid resource ID format');
      });
    });

    describe('PUT /api/books/:id', () => {
      beforeEach(async () => {
        const book = await Book.create(validBookData);
        bookId = book._id.toString();
      });

      it('should update a book with valid data', async () => {
        const updateData = {
          title: 'Updated Title',
          genre: 'Updated Genre',
          available: false
        };

        const res = await request(app)
          .put(`/api/books/${bookId}`)
          .send(updateData)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Book updated successfully');
        expect(res.body.data.title).toBe(updateData.title);
        expect(res.body.data.genre).toBe(updateData.genre);
        expect(res.body.data.available).toBe(updateData.available);
      });

      it('should update only provided fields', async () => {
        const partialUpdate = {
          title: 'Partially Updated Title'
        };

        const res = await request(app)
          .put(`/api/books/${bookId}`)
          .send(partialUpdate)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(partialUpdate.title);
        expect(res.body.data.author).toBe(validBookData.author); // Should remain unchanged
      });

      it('should return 404 for non-existent book', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .put(`/api/books/${nonExistentId}`)
          .send({ title: 'Updated Title' })
          .expect('Content-Type', /json/)
          .expect(404);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Book not found');
      });

      it('should return validation error for invalid update data', async () => {
        const invalidUpdate = {
          year: 'invalid-year'
        };

        const res = await request(app)
          .put(`/api/books/${bookId}`)
          .send(invalidUpdate)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Validation failed');
      });
    });

    describe('DELETE /api/books/:id', () => {
      beforeEach(async () => {
        const book = await Book.create(validBookData);
        bookId = book._id.toString();
      });

      it('should delete a book successfully', async () => {
        const res = await request(app)
          .delete(`/api/books/${bookId}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Book deleted successfully');

        // Verify book is deleted
        const deletedBook = await Book.findById(bookId);
        expect(deletedBook).toBeNull();
      });

      it('should return 404 for non-existent book', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .delete(`/api/books/${nonExistentId}`)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Book not found');
      });
    });
  });

  describe('Advanced Book Features', () => {
    beforeEach(async () => {
      await Book.create([
        {
          title: 'Fiction Book 1',
          author: 'Fiction Author',
          year: 2020,
          genre: 'Fiction',
          rating: 4.5,
          available: true
        },
        {
          title: 'Fiction Book 2',
          author: 'Fiction Author',
          year: 2021,
          genre: 'Fiction',
          rating: 4.0,
          available: false
        },
        {
          title: 'Non-Fiction Book',
          author: 'Non-Fiction Author',
          year: 2019,
          genre: 'Non-Fiction',
          rating: 3.5,
          available: true
        }
      ]);
    });

    describe('GET /api/books/stats', () => {
      it('should return book statistics', async () => {
        const res = await request(app)
          .get('/api/books/stats')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('general');
        expect(res.body.data).toHaveProperty('genreDistribution');
        expect(res.body.data.general.totalBooks).toBe(3);
        expect(res.body.data.general.availableBooks).toBe(2);
        expect(res.body.data.general.checkedOutBooks).toBe(1);
      });
    });

    describe('GET /api/books/genre/:genre', () => {
      it('should get books by genre', async () => {
        const res = await request(app)
          .get('/api/books/genre/fiction')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.genre).toBe('fiction');
        expect(res.body.data.every(book => book.genre === 'Fiction')).toBe(true);
      });
    });

    describe('GET /api/books/author/:author', () => {
      it('should get books by author', async () => {
        const res = await request(app)
          .get('/api/books/author/fiction author')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.author).toBe('fiction author');
        expect(res.body.data.every(book => book.author === 'Fiction Author')).toBe(true);
      });
    });

    describe('PATCH /api/books/:id/toggle-availability', () => {
      it('should toggle book availability', async () => {
        const book = await Book.findOne({ title: 'Fiction Book 1' });

        const res = await request(app)
          .patch(`/api/books/${book._id}/toggle-availability`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('toggled');
        expect(res.body.data.available).toBe(false); // Should be toggled from true to false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for undefined routes', async () => {
      const res = await request(app)
        .get('/api/nonexistent-route')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Route');
      expect(res.body.message).toContain('not found');
    });

    it('should handle malformed JSON', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Content-Type', 'application/json')
        .send('{"title": "Test", "author": }') // Malformed JSON
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid JSON');
    });
  });

  describe('Response Time', () => {
    it('should respond to health check within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should respond to book creation within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/books')
        .send(validBookData)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });
});