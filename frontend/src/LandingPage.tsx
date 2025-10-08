import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Book, Calendar, Tag, Globe, Star, Filter, X, ChevronLeft, ChevronRight, BookOpen, Library, TrendingUp, Users } from 'lucide-react';

interface Book {
  id?: string;
  title: string;
  author: string;
  year: number;
  isbn: string;
  genre: string;
  description: string;
  available: boolean;
  pages: number;
  publisher: string;
  language: string;
  rating: number;
  tags: string[];
  addedBy: string;
}

const LandingPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<Book>({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    isbn: '',
    genre: '',
    description: '',
    available: true,
    pages: 0,
    publisher: '',
    language: 'English',
    rating: 0,
    tags: [],
    addedBy: ''
  });
  const [tagInput, setTagInput] = useState('');

  const itemsPerPage = 12;

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    let filtered = books;

    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
      );
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === selectedGenre);
    }

    setFilteredBooks(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, books]);

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/books');
      const data = await response.json();
      setBooks(data.data);
      setFilteredBooks(data.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    try {
      console.log(formData)
      const response = await fetch('http://localhost:3000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        fetchBooks();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleUpdateBook = async () => {
    if (!selectedBook?.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        fetchBooks();
        setShowEditModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/books/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchBooks();
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      year: new Date().getFullYear(),
      isbn: '',
      genre: '',
      description: '',
      available: true,
      pages: 0,
      publisher: '',
      language: 'English',
      rating: 0,
      tags: [],
      addedBy: ''
    });
    setTagInput('');
    setSelectedBook(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const genres = useMemo(() => {
    const genreSet = new Set(books.map(book => book.genre));
    return Array.from(genreSet).filter(Boolean);
  }, [books]);

  const stats = useMemo(() => ({
    total: books.length,
    available: books.filter(b => b.available).length,
    avgRating: books.length > 0 ? (books.reduce((acc, b) => acc + b.rating, 0) / books.length).toFixed(1) : '0',
    totalPages: books.reduce((acc, b) => acc + b.pages, 0)
  }), [books]);

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBooks, currentPage]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
    <div className={`fixed inset-0 ${!children ? 'hidden' : ''} bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50`}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        <div className="p-6">
          <button onClick={onClose} className="float-right text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                  <Library className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Library Hub
                  </h1>
                  <p className="text-xs text-gray-400">Digital Collection Manager</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-purple-600/20 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-800 hover:border-purple-600/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Books</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-800 hover:border-blue-600/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Available</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.available}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-800 hover:border-green-600/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Rating</p>
                  <p className="text-2xl font-bold text-white mt-1">⭐ {stats.avgRating}</p>
                </div>
                <Star className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-800 hover:border-orange-600/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Pages</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalPages.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-800 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
                >
                  <option value="all">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="group bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-purple-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-600/10"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-purple-400 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">{book.author}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${book.available ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                          {book.available ? 'Available' : 'Borrowed'}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm line-clamp-2 mb-3">{book.description}</p>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-xs text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{book.year}</span>
                          <span className="mx-2">•</span>
                          <span>{book.pages} pages</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <Tag className="w-3 h-3 mr-1" />
                          <span>{book.genre}</span>
                          <span className="mx-2">•</span>
                          <Globe className="w-3 h-3 mr-1" />
                          <span>{book.language}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          <span className="text-yellow-500">{book.rating}</span>
                        </div>
                      </div>

                      {book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {book.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex space-x-2 pt-3 border-t border-gray-800">
                        <button
                          onClick={() => {
                            setSelectedBook(book);
                            setFormData(book);
                            setShowEditModal(true);
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id!)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {/* {(showAddModal || showEditModal) && (
        <Modal onClose={() => {
          showAddModal ? setShowAddModal(false) : setShowEditModal(false);
          resetForm();
        }}>
          
        </Modal>
      )} */}

      <Modal
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
      >
        {(showAddModal || showEditModal) && (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">
              {showAddModal ? 'Add New Book' : 'Edit Book'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Author</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ISBN</label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Genre</label>
                  <input
                    type="text"
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Pages</label>
                  <input
                    type="number"
                    required
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Publisher</label>
                  <input
                    type="text"
                    required
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    required
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Added By</label>
                  <input
                    type="text"
                    required
                    value={formData.addedBy}
                    onChange={(e) => setFormData({ ...formData, addedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-sm flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-purple-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-600"
                />
                <label htmlFor="available" className="text-sm text-gray-400">
                  Book is available
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    showAddModal ? setShowAddModal(false) : setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
                  onClick={showAddModal ? handleAddBook : handleUpdateBook}
                >
                  {showAddModal ? 'Add Book' : 'Update Book'}
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

    </div>
  );
};

export default LandingPage;