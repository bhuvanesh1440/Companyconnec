import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Modal,
  Paper,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import * as Lucide from "lucide-react";

// --- Configuration & Constants ---
const itemsPerPage = 8;
const companyFields = ['name', 'ceo', 'industry', 'location', 'employees', 'founded', 'logoIcon'];
// API calls use relative paths, assuming a proxy (like Vite) redirects /api to the backend (port 3002)

const theme = createTheme({
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    h3: { fontWeight: 700, fontSize: '2.5rem' },
    h6: { fontWeight: 600 },
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        }
      }
    }
  }
});

// --- Utility Components ---

const DynamicIcon = ({ name, ...props }) => {
  const IconComponent = Lucide[name] || Lucide.Briefcase;
  return <IconComponent {...props} />;
};

// --- Modals ---

const StyledModalPaper = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  p: 4,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[24],
}));

const CompanyFormModal = ({ open, onClose, companyData, onSubmit, industryOptions, locationOptions }) => {
  // Check for MongoDB's native _id for edit mode
  const isEdit = !!companyData?._id; 
  const [formData, setFormData] = useState(companyData || {
    name: '', ceo: '', industry: industryOptions[1], location: locationOptions[1], employees: 0, founded: new Date().getFullYear(), logoIcon: 'Building',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // When modal opens with new data, update form state
    setFormData(companyData || {
      name: '', ceo: '', industry: industryOptions[1], location: locationOptions[1], employees: 0, founded: new Date().getFullYear(), logoIcon: 'Building',
    });
  }, [companyData, open, industryOptions, locationOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
    // onClose is called by the parent component after successful submission 
    // in the previous implementation, but it's safer to call it here to close the modal.
    onClose(); 
  };

  return (
    <Modal open={open} onClose={onClose}>
      <StyledModalPaper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h5" mb={3}>{isEdit ? 'Edit Company Profile' : 'Add New Company'}</Typography>
        <Grid container spacing={3}>
          {companyFields.map((field) => (
            // Adjusted grid sizes for better responsiveness
            <Grid item xs={12} sm={field === 'logoIcon' ? 6 : 12} md={field === 'logoIcon' ? 4 : 6} key={field}>
              <TextField
                fullWidth
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                value={formData[field] || ''} // Use empty string for controlled component
                onChange={handleChange}
                type={field === 'employees' || field === 'founded' ? 'number' : 'text'}
                select={field === 'industry' || field === 'location'}
                disabled={submitting}
              >
                {field === 'industry' && industryOptions.slice(1).map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
                {field === 'location' && locationOptions.slice(1).map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
                {field === 'logoIcon' && ['Building', 'Briefcase', 'Coffee', 'Globe', 'Zap', 'Shield', 'Layers', 'Feather'].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DynamicIcon name={opt} size={18} />
                      <Typography>{opt}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : (isEdit ? 'Save Changes' : 'Create Company')}
          </Button>
        </Stack>
      </StyledModalPaper>
    </Modal>
  );
};

const DeleteConfirmModal = ({ open, onClose, company, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    // Use _id for MongoDB compatibility
    await onConfirm(company._id); 
    setDeleting(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <StyledModalPaper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h6" color="error" mb={2}>Confirm Deletion</Typography>
        <Typography>
          Are you sure you want to permanently delete the profile for **{company?.name || 'this company'}**? This action cannot be undone.
        </Typography>
        <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
          <Button onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </Stack>
      </StyledModalPaper>
    </Modal>
  );
};

// --- Card Component ---

const CompanyCard = React.memo(({ company, onEdit, onDelete }) => {
  return (
    <Card
      sx={{
        transition: "all 0.3s",
        "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "#e3f2fd", // Light blue background
              border: "3px solid",
              borderColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DynamicIcon name={company.logoIcon} size={32} color="#1976d2" />
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => onEdit(company)} color="primary">
              <Lucide.Edit size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(company)} color="error">
              <Lucide.Trash2 size={18} />
            </IconButton>
          </Stack>
        </Stack>

        <Stack spacing={0.5} mb={2}>
          <Typography variant="h6" noWrap>
            {company.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Lucide.MapPin size={14} color="#757575" />
            <Typography variant="body2" color="text.secondary">
              {company.location}
            </Typography>
            <Chip label={company.industry} size="small" color="primary" sx={{ ml: 1 }} />
          </Stack>
        </Stack>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Stack spacing={0.5}>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                <Lucide.Users size={16} style={{ marginRight: 4 }} />
                {company.employees.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Employees
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack spacing={0.5}>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                <Lucide.Calendar size={16} style={{ marginRight: 4 }} />
                {company.founded}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Founded
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Lucide.User size={16} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>CEO: {company.ceo}</Typography>
            </Stack>
          </Grid>
        </Grid>

      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button variant="outlined" fullWidth>
            View Details
        </Button>
      </Box>
    </Card>
  );
});

// --- Layout Components ---

const Header = ({ onOpenAddModal }) => (
  <Paper elevation={1} sx={{ bgcolor: 'white', p: 2, mb: 4, borderRadius: 0 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" maxWidth="1200px" margin="0 auto">
      <Stack direction="row" alignItems="center" spacing={2}>
        <Lucide.Globe size={32} color={theme.palette.primary.main} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
          Frontlines Directory
        </Typography>
      </Stack>
      <Button
        variant="contained"
        startIcon={<Lucide.Plus size={18} />}
        onClick={onOpenAddModal}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        Add Company
      </Button>
      <IconButton color="primary" onClick={onOpenAddModal} sx={{ display: { xs: 'flex', sm: 'none' } }}>
        <Lucide.Plus size={24} />
      </IconButton>
    </Stack>
  </Paper>
);

const Footer = () => (
  <Box component="footer" sx={{ bgcolor: '#333', color: 'white', p: 4, mt: 6, borderRadius: 0 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'center', md: 'flex-start' }} spacing={3} maxWidth="1200px" margin="0 auto">
      <Box>
        <Typography variant="h6" gutterBottom>Frontlines Media</Typography>
        <Typography variant="body2" color="text.secondary">Advanced Directory Solutions</Typography>
      </Box>
      <Stack direction="row" spacing={3}>
        <Button color="inherit" sx={{ '&:hover': { textDecoration: 'underline' } }}>About</Button>
        <Button color="inherit" sx={{ '&:hover': { textDecoration: 'underline' } }}>Privacy</Button>
        <Button color="inherit" sx={{ '&:hover': { textDecoration: 'underline' } }}>Contact</Button>
      </Stack>
    </Stack>
    <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
    <Typography variant="caption" align="center" display="block" color="text.secondary">
      © {new Date().getFullYear()} Frontlines Directory Pro. All rights reserved.
    </Typography>
  </Box>
);

// --- Main App ---

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "", industry: "All", location: "All" });
  const [sort, setSort] = useState({ field: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null); // Null for Add, object for Edit
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCompany, setDeleteCompany] = useState(null);

  const industryOptions = useMemo(
    () => ["All", "Technology", "Healthcare", "Food & Beverage", "Consulting", "Finance"],
    []
  );
  const locationOptions = useMemo(
    () => ["All", "San Francisco", "New York City", "Chicago", "London", "Singapore", "Berlin"],
    []
  );
  const sortOptions = useMemo(
    () => [
      { id: 'name', label: 'Name' },
      { id: 'employees', label: 'Employees' },
      { id: 'founded', label: 'Founded Year' }
    ], []
  );


  // --- CRUD Logic ---

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use relative path for Vite proxy
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error("Failed to fetch data.");
      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load company data. Check if backend server is running on port 3002.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreateOrUpdate = async (companyData) => {
    // CRITICAL FIX: Check for MongoDB's native _id for edit mode
    const isEdit = !!companyData._id; 
    
    try {
      // Use companyData._id for PUT request
      const url = isEdit ? `/api/companies/${companyData._id}` : '/api/companies';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        // Handle 400 Bad Request specifically for validation errors
        const errorData = await response.json();
        throw new Error(`Server Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      
      // A successful PUT returns the updated object (200), POST returns the new object (201)
      const updatedCompany = method === 'PUT' ? await response.json() : await response.json();

      if (isEdit) {
        // Update the list with the modified item
        setCompanies(prev => prev.map(c => c._id === updatedCompany._id ? updatedCompany : c));
      } else {
        // Add new item to the list
        setCompanies(prev => [updatedCompany, ...prev]);
        setCurrentPage(1); // Reset to page 1 to see the new item
      }

    } catch (err) {
      console.error(err);
      setError(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Use relative path and the MongoDB _id
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
          throw new Error("Company not found on the server.");
      }
      
      // 204 No Content is a successful response for DELETE
      if (response.status !== 204) {
          // If the server returns content on an error (e.g., 500)
          const errorData = await response.json().catch(() => ({ message: "Unknown deletion error." }));
          throw new Error(`Deletion failed: ${errorData.message}`);
      }
      
      // Update the state by filtering out the deleted item using _id
      setCompanies(prev => prev.filter(c => c._id !== id));

    } catch (err) {
      console.error(err);
      setError(`Deletion failed: ${err.message}`);
    }
  };

  // --- Filtering & Sorting ---

  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];
    const { search, industry, location } = filters;
    const { field, direction } = sort;

    // 1. Filtering
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.ceo.toLowerCase().includes(lowerSearch) ||
          c.location.toLowerCase().includes(lowerSearch) ||
          c.industry.toLowerCase().includes(lowerSearch)
      );
    }
    if (industry !== "All") result = result.filter((c) => c.industry === industry);
    if (location !== "All") result = result.filter((c) => c.location === location);

    // 2. Sorting
    result.sort((a, b) => {
      const aVal = typeof a[field] === "string" ? a[field].toLowerCase() : a[field];
      const bVal = typeof b[field] === "string" ? b[field].toLowerCase() : b[field];

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, filters, sort]);

  // --- Pagination ---

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCompanies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCompanies, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);

  // --- Handlers ---

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSortChange = (field) => {
    setSort((prev) => {
      const newDirection = prev.field === field && prev.direction === "asc" ? "desc" : "asc";
      return { field, direction: newDirection };
    });
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setEditCompany(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (company) => {
    // Pass the company object for editing
    setEditCompany(company);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (company) => {
    // Pass the company object for deletion
    setDeleteCompany(company);
    setIsDeleteModalOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header onOpenAddModal={openAddModal} />

        <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1200px', margin: '0 auto' }}>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              Company Directory ({filteredAndSortedCompanies.length})
            </Typography>
            {/* Show Add button for small screens */}
            <Button
              variant="contained"
              startIcon={<Lucide.Plus size={18} />}
              onClick={openAddModal}
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              Add
            </Button>
          </Stack>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Quickly filter, sort, and manage all company profiles in one place.
          </Typography>

          {/* Filters and Sorting Controls */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search Name/CEO/Location"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  InputProps={{ endAdornment: <Lucide.Search size={20} /> }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Industry"
                  name="industry"
                  value={filters.industry}
                  onChange={handleFilterChange}
                  size="small"
                >
                  {industryOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Location"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  size="small"
                >
                  {locationOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                <TextField
                  select
                  fullWidth
                  label="Sort By"
                  name="sortField"
                  value={sort.field}
                  onChange={(e) => handleSortChange(e.target.value)}
                  size="small"
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                  ))}
                </TextField>
                <IconButton
                  onClick={() => setSort(p => ({ ...p, direction: p.direction === 'asc' ? 'desc' : 'asc' }))}
                  size="small"
                  sx={{ border: '1px solid #ccc' }}
                >
                  {sort.direction === 'asc' ? <Lucide.ArrowDownAZ size={20} /> : <Lucide.ArrowUpZA size={20} />}
                </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Content Area */}
          {loading ? (
            <Stack alignItems="center" mt={8}>
              <CircularProgress size={60} />
              <Typography mt={2} variant="h6" color="text.secondary">Fetching Company Data...</Typography>
            </Stack>
          ) : error ? (
            <Box p={3} bgcolor="error.main" color="white" borderRadius={2} textAlign="center">
              <Typography variant="h6">{error}</Typography>
              <Typography variant="body2" mt={1}>Please ensure the backend server is running on `http://localhost:3002`.</Typography>
              <Button onClick={fetchCompanies} variant="outlined" sx={{ color: 'white', borderColor: 'white', mt: 2 }}>
                Try Again
              </Button>
            </Box>
          ) : paginatedCompanies.length === 0 ? (
            <Box p={6} bgcolor="background.paper" borderRadius={3} textAlign="center" border="1px dashed #ccc">
              <Lucide.Frown size={40} color="#616161" />
              <Typography variant="h6" mt={2} color="text.secondary">
                No companies match your current filters.
              </Typography>
              <Button onClick={() => setFilters({ search: "", industry: "All", location: "All" })} sx={{ mt: 2 }}>
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {paginatedCompanies.map((company) => (
                  // Use MongoDB's native _id for keying
                  <Grid item xs={12} sm={6} md={4} lg={3} key={company._id}>
                    <CompanyCard 
                      company={company} 
                      onEdit={openEditModal}
                      onDelete={openDeleteModal}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Stack direction="row" spacing={1} justifyContent="center" mt={6} flexWrap="wrap">
                  <IconButton
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    size="large"
                  >
                    <Lucide.ChevronLeft />
                  </IconButton>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "contained" : "outlined"}
                      onClick={() => setCurrentPage(page)}
                      sx={{ minWidth: 40 }}
                    >
                      {page}
                    </Button>
                  ))}
                  <IconButton
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    size="large"
                  >
                    <Lucide.ChevronRight />
                  </IconButton>
                </Stack>
              )}
            </>
          )}
        </Box>
        
        <Footer />
        
        {/* Modals */}
        <CompanyFormModal
          open={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          companyData={editCompany}
          onSubmit={handleCreateOrUpdate}
          industryOptions={industryOptions}
          locationOptions={locationOptions}
        />
        
        {deleteCompany && (
          <DeleteConfirmModal
            open={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            company={deleteCompany}
            onConfirm={handleDelete}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}
