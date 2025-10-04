import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import * as Lucide from "lucide-react";

// --- Utility Components ---

const DynamicIcon = ({ name, ...props }) => {
  const IconComponent = Lucide[name] || Lucide.Package;
  return <IconComponent {...props} />;
};

const CompanyCard = React.memo(({ company }) => {
  return (
    <Card
      sx={{
        transition: "all 0.3s",
        "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: "white",
              border: "2px solid",
              borderColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DynamicIcon name={company.logoIcon} size={28} color="#1976d2" />
          </Box>
          <Chip label={company.industry} color="primary" />
        </Stack>

        <Stack spacing={0.5} mb={2}>
          <Typography variant="h6" noWrap>
            {company.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Lucide.MapPin size={14} />
            <Typography variant="body2" color="text.secondary">
              {company.location}
            </Typography>
          </Stack>
        </Stack>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Lucide.Users size={14} />
                <Typography variant="body2">{company.employees.toLocaleString()}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Employees
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Lucide.Calendar size={14} />
                <Typography variant="body2">{company.founded}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Founded
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Lucide.User size={14} />
              <Typography variant="body2">CEO: {company.ceo}</Typography>
            </Stack>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          fullWidth
          onClick={() => console.log(`Viewing details for ${company.name}`)}
        >
          View Full Profile
        </Button>
      </CardContent>
    </Card>
  );
});

// --- Main App ---

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "", industry: "All", location: "All" });
  const [sort, setSort] = useState({ field: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const industryOptions = useMemo(
    () => ["All", "Technology", "Healthcare", "Food & Beverage", "Consulting", "Finance"],
    []
  );
  const locationOptions = useMemo(
    () => ["All", "San Francisco", "New York City", "Chicago", "London", "Singapore"],
    []
  );

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/companies");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load company data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Filter + Sort
  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];
    const { search, industry, location } = filters;
    const { field, direction } = sort;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.ceo.toLowerCase().includes(lowerSearch) ||
          c.location.toLowerCase().includes(lowerSearch)
      );
    }
    if (industry !== "All") result = result.filter((c) => c.industry === industry);
    if (location !== "All") result = result.filter((c) => c.location === location);

    result.sort((a, b) => {
      const aVal = typeof a[field] === "string" ? a[field].toLowerCase() : a[field];
      const bVal = typeof b[field] === "string" ? b[field].toLowerCase() : b[field];
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, filters, sort]);

  // Pagination
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCompanies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCompanies, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);

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

  return (
    <Box p={4} minHeight="100vh">
      <Typography variant="h3" gutterBottom>
        Frontlines Directory Pro
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage and explore company profiles with advanced filtering and sorting.
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Industry"
            name="industry"
            value={filters.industry}
            onChange={handleFilterChange}
          >
            {industryOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Location"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
          >
            {locationOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Content */}
      {loading ? (
        <Stack alignItems="center" mt={8}>
          <CircularProgress size={48} />
          <Typography mt={2}>Fetching Company Data...</Typography>
        </Stack>
      ) : error ? (
        <Box p={2} bgcolor="error.main" color="error.contrastText" borderRadius={1}>
          {error}
        </Box>
      ) : paginatedCompanies.length === 0 ? (
        <Box p={4} bgcolor="grey.100" borderRadius={1} textAlign="center">
          <Typography>No companies found. Try adjusting your filters.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedCompanies.map((company) => (
              <Grid item xs={12} sm={6} md={4} key={company.id}>
                <CompanyCard company={company} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Stack direction="row" spacing={1} justifyContent="center" mt={4} flexWrap="wrap">
              <IconButton
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Lucide.ChevronLeft />
              </IconButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "contained" : "outlined"}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <IconButton
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <Lucide.ChevronRight />
              </IconButton>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
