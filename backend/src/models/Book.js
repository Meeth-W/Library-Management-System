const mongoose = require('mongoose');

// Define the Book schema
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true // Index for better search performance
  },
  
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    minlength: [1, 'Author name must be at least 1 character long'],
    maxlength: [100, 'Author name cannot exceed 100 characters'],
    index: true // Index for better search performance
  },
  
  year: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be at least 1000'],
    max: [new Date().getFullYear(), `Publication year cannot exceed ${new Date().getFullYear()}`],
    validate: {
      validator: Number.isInteger,
      message: 'Publication year must be an integer'
    },
    index: true // Index for filtering by year
  },
  
  isbn: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple documents without ISBN
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // ISBN is optional
        // Enhanced ISBN validation (supports ISBN-10 and ISBN-13 with or without hyphens)
        const isbn10Pattern = /^(?:\d{9}[\dX]|\d{1,5}-\d{1,7}-\d{1,7}-[\dX])$/;
        const isbn13Pattern = /^(?:\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-\d{1,7}-\d{1,7})$/;
        return isbn10Pattern.test(v) || isbn13Pattern.test(v);
      },
      message: 'Please enter a valid ISBN-10 or ISBN-13'
    }
  },
  
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters'],
    index: true, // Index for filtering by genre
    enum: {
      values: [
        'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
        'Fantasy', 'Biography', 'History', 'Science', 'Technology',
        'Philosophy', 'Religion', 'Self-Help', 'Business', 'Education',
        'Children', 'Young Adult', 'Classic Literature', 'Poetry', 'Drama',
        'Cookbook', 'Travel', 'Art', 'Music', 'Sports', 'Health',
        'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'
      ],
      message: 'Genre must be one of the predefined categories'
    }
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  available: {
    type: Boolean,
    default: true,
    index: true // Index for filtering available books
  },
  
  pages: {
    type: Number,
    min: [1, 'Number of pages must be at least 1'],
    max: [10000, 'Number of pages cannot exceed 10000'],
    validate: {
      validator: function(v) {
        return !v || Number.isInteger(v);
      },
      message: 'Number of pages must be an integer'
    }
  },
  
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  
  language: {
    type: String,
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters'],
    default: 'English'
  },
  
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    validate: {
      validator: function(v) {
        return !v || (v >= 0 && v <= 5);
      },
      message: 'Rating must be between 0 and 5'
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  
  // Metadata
  addedBy: {
    type: String,
    default: 'system',
    maxlength: [50, 'Added by field cannot exceed 50 characters']
  },
  
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for better query performance
bookSchema.index({ title: 1, author: 1 }); // Compound index for title and author
bookSchema.index({ genre: 1, year: 1 }); // Compound index for genre and year
bookSchema.index({ available: 1, genre: 1 }); // Compound index for availability and genre
bookSchema.index({ 
  title: 'text', 
  author: 'text', 
  description: 'text' 
}, {
  weights: {
    title: 10,
    author: 5,
    description: 1
  },
  name: 'book_text_index'
}); // Text index for search functionality

// Virtual for book age
bookSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Virtual for full book info
bookSchema.virtual('fullInfo').get(function() {
  return `${this.title} by ${this.author} (${this.year})`;
});

// Virtual for availability status
bookSchema.virtual('status').get(function() {
  return this.available ? 'Available' : 'Checked Out';
});

// Pre-save middleware
bookSchema.pre('save', function(next) {
  // Update lastModified timestamp
  this.lastModified = new Date();
  
  // Capitalize first letter of genre if provided
  if (this.genre) {
    this.genre = this.genre.charAt(0).toUpperCase() + this.genre.slice(1).toLowerCase();
  }
  
  // Clean up tags array
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags.filter(tag => tag.trim() !== '').map(tag => tag.trim().toLowerCase());
    // Remove duplicates
    this.tags = [...new Set(this.tags)];
  }
  
  next();
});

// Pre-update middleware
bookSchema.pre('findOneAndUpdate', function(next) {
  // Update lastModified timestamp for updates
  this.set({ lastModified: new Date() });
  next();
});

// Instance methods
bookSchema.methods.toggleAvailability = function() {
  this.available = !this.available;
  return this.save();
};

bookSchema.methods.addTag = function(tag) {
  if (tag && typeof tag === 'string') {
    const cleanTag = tag.trim().toLowerCase();
    if (!this.tags.includes(cleanTag)) {
      this.tags.push(cleanTag);
    }
  }
  return this.save();
};

bookSchema.methods.removeTag = function(tag) {
  if (tag && typeof tag === 'string') {
    const cleanTag = tag.trim().toLowerCase();
    this.tags = this.tags.filter(t => t !== cleanTag);
  }
  return this.save();
};

// Static methods
bookSchema.statics.findByGenre = function(genre) {
  return this.find({ 
    genre: new RegExp(genre, 'i'),
    available: true 
  });
};

bookSchema.statics.findByAuthor = function(author) {
  return this.find({ 
    author: new RegExp(author, 'i') 
  });
};

bookSchema.statics.findAvailable = function() {
  return this.find({ available: true });
};

bookSchema.statics.searchBooks = function(query) {
  return this.find({
    $or: [
      { title: new RegExp(query, 'i') },
      { author: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  });
};

// Query helpers
bookSchema.query.byGenre = function(genre) {
  return this.where({ genre: new RegExp(genre, 'i') });
};

bookSchema.query.byYear = function(year) {
  return this.where({ year });
};

bookSchema.query.available = function() {
  return this.where({ available: true });
};

bookSchema.query.recent = function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where({ createdAt: { $gte: date } });
};

// Create and export the model
const Book = mongoose.model('Book', bookSchema);

module.exports = Book;