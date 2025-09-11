import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  styled
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1
});

export default function 
() {
  const [employees, setEmployees] = useState([]);
  const [batchId, setBatchId] = useState(() => 'BATCH-' + Date.now().toString(36).toUpperCase());
  const [errors, setErrors] = useState([]);

  // Central column definition for dynamic table
  // Transaction ID generator function (replace with your own if needed)
  const generateTransactionId = () => {
    return 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const columns = [
    { key: "transactionId", label: "Transaction ID", placeholder: "Transaction ID" },
    { key: "date", label: "Date" },
    { key: "debitAccount", label: "Debit Account" },
    { key: "creditAccount", label: "Credit Account" },
    { key: "debitCurrency", label: "Debit Currency" },
    { key: "debitAmount", label: "Debit Amount" },
    { key: "creditCurrency", label: "Credit Currency" },
    { key: "creditAmount", label: "Credit Amount" },
    { key: "employeeName", label: "Employee Name" },
    { key: "bankID", label: "Bank ID" },
    { key: "remarks", label: "Remarks (optional)" }
  ];

  const getToday = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  const addRow = () => {
    const emptyRow = {};
    columns.forEach((col) => {
      if (col.key === "date") {
        emptyRow[col.key] = getToday();
      } else if (col.key === "transactionId") {
        emptyRow[col.key] = generateTransactionId();
      } else {
        emptyRow[col.key] = "";
      }
    });
    emptyRow.batchId = batchId;
    setEmployees((prev) => [...prev, emptyRow]);
    setErrors((prev) => [...prev, validateRow(emptyRow)]);
  };

  const updateEmployee = (index, field, value) => {
    const updated = [...employees];
    updated[index][field] = value;
    setEmployees(updated);
    const newErrors = [...errors];
    newErrors[index] = validateRow(updated[index]);
    setErrors(newErrors);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const formattedData = parsedData.map((row) => {
        const obj = {};
        columns.forEach((col) => {
          if (col.key === "date") {
            obj[col.key] = row[col.label] || row[col.key] || row[col.key.charAt(0).toUpperCase() + col.key.slice(1)] || getToday();
          } else if (col.key === "transactionId") {
            obj[col.key] = row[col.label] || row[col.key] || row[col.key.charAt(0).toUpperCase() + col.key.slice(1)] || generateTransactionId();
          } else {
            obj[col.key] = row[col.label] || row[col.key] || row[col.key.charAt(0).toUpperCase() + col.key.slice(1)] || "";
          }
        });
        obj.batchId = batchId;
        return obj;
      });

      setEmployees((prev) => {
        const newEmployees = [...prev, ...formattedData];
        setErrors(newEmployees.map(validateRow));
        return newEmployees;
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const deleteRow = (index) => {
    setEmployees((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const hasErrors = () => {
    return errors.some((err) => err && Object.keys(err).length > 0);
  };

  const processBatch = () => {
    if (hasErrors()) {
      alert("Please fix validation errors before processing batch.");
      return;
    }
    console.log("Processing Batch:", employees);
    alert("Batch processed successfully!");
  };

  // Validation function for a row
  function validateRow(row) {
    const err = {};
    // All fields except remarks are mandatory
    columns.forEach((col) => {
      if (col.key !== "remarks" && (!row[col.key] || row[col.key].toString().trim() === "")) {
        err[col.key] = "Required";
      }
    });
    // bank id: strictly 7 digits
    if (row.bankID && !/^\d{7}$/.test(row.bankID)) {
      err.bankID = "Bank ID must be exactly 7 digits";
    }
    // employee name: only alphabets
    if (row.employeeName && !/^[A-Za-z ]+$/.test(row.employeeName)) {
      err.employeeName = "Only alphabets allowed";
    }
    // debit/credit account: strictly 8 numeric
    if (row.debitAccount && !/^\d{8}$/.test(row.debitAccount)) {
      err.debitAccount = "Must be 8 digits";
    }
    if (row.creditAccount && !/^\d{8}$/.test(row.creditAccount)) {
      err.creditAccount = "Must be 8 digits";
    }
    // debit/credit amount: numeric
    if (row.debitAmount && isNaN(row.debitAmount)) {
      err.debitAmount = "Must be numeric";
    }
    if (row.creditAmount && isNaN(row.creditAmount)) {
      err.creditAmount = "Must be numeric";
    }
    // debit/credit currency: alphabets only
    if (row.debitCurrency && !/^[A-Za-z]+$/.test(row.debitCurrency)) {
      err.debitCurrency = "Alphabets only";
    }
    if (row.creditCurrency && !/^[A-Za-z]+$/.test(row.creditCurrency)) {
      err.creditCurrency = "Alphabets only";
    }
    return err;
  }

  const logRows = () => {
  employees.forEach((row, idx) => {
    console.log(`Row ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  });
};

  return (
    <div style={{ padding: 16 }}>
      <Card elevation={3} style={{ padding: 12 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold", color: "primary.main", textAlign: 'center' }}>
          Payroll Payments
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
          <TextField
            label="Batch ID"
            variant="outlined"
            size="small"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <Box display="flex" gap={2}>
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ maxHeight: 40 }}
            >
              Upload File
              <VisuallyHiddenInput
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={addRow}
              startIcon={<AddIcon />}
              sx={{ maxHeight: 40 }}
            >
              Add Row
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} style={{ marginBottom: "8px", overflowX: "auto", width: '100vw', maxWidth: '96vw', maxHeight: 400, overflowY: "auto" }}>
          <Table style={{ minWidth: 100, width: '100%' }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.label}</TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {employees.map((emp, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder={col.placeholder || col.label}
                        value={emp[col.key]}
                        onChange={(e) =>
                          updateEmployee(index, col.key, e.target.value)
                        }
                        InputProps={col.key === "date" || col.key === "transactionId" ? { readOnly: true } : {}}
                        error={!!errors[index]?.[col.key]}
                        helperText={errors[index]?.[col.key]}
                        fullWidth
                        sx={{ minWidth: 100, p: 0.5}}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => deleteRow(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          color="success"
          onClick={processBatch}
          startIcon={<CheckIcon />}
          disabled={hasErrors() || employees.length === 0}
        >
          Process Batch
        </Button>
      </Card>

    <Button
  variant="outlined"
  color="secondary"
  onClick={logRows}
  style={{ marginTop: 16, marginRight: 8 }}
>
  Log Rows
</Button>

    </div>
  );
}
