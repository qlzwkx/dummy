import React, { useState } from "react";
import * as XLSX from "xlsx";
import { 
  Button,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper, Typography
} from "@mui/material";

export default function PayrollForm() {
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState([]);

  const getEmpErrors = (emp) => {
    const empErrors = {};
    if (!emp.id) empErrors.id = "Employee ID is required";
    if (!emp.name || !/^[A-Za-z ]+$/.test(emp.name)) empErrors.name = "Name must contain only alphabets";
    if (!emp.salary) empErrors.salary = "Salary is required";
    if (!emp.bank || !/^\d{7}$/.test(emp.bank)) empErrors.bank = "Bank ID must be exactly 7 digits";
    if (!emp.date || !/^\d{4}-\d{2}-\d{2}$/.test(emp.date)) {
      empErrors.date = "Date must be in yyyy-mm-dd format";
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const dateValue = new Date(emp.date);
      if (isNaN(dateValue.getTime())) {
        empErrors.date = "Invalid date";
      } else if (dateValue < today) {
        empErrors.date = "Date cannot be in the past";
      }
    }
    return empErrors;
  };

  const normalizeDate = (value) => {
    if (value === null || value === undefined || value === "") return "";
    if (value instanceof Date && !isNaN(value)) return value.toISOString().slice(0, 10);

    const str = String(value).trim();
    if (!str) return "";

    const digits = str.replace(/\D/g, "");
    if (digits.length === 8) return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const parsed = new Date(str);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);

    return str;
  };

  const formatDateInput = (value) => {
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0,4)}-${digits.slice(4)}`;
    return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
  };

  const addRow = () => {
    const newEmp = { id: "", name: "", salary: "", bank: "", date: "" };
    setEmployees((prev) => [...prev, newEmp]);
    setErrors((prev) => [...prev, getEmpErrors(newEmp)]);
  };

  const updateEmployee = (index, field, value) => {
    const updated = [...employees];
    let newValue = value;
    if (field === "date") {
      newValue = formatDateInput(value);
    }
    updated[index][field] = newValue;
    setEmployees(updated);

    const newErrors = [...errors];
    newErrors[index] = getEmpErrors(updated[index]);
    setErrors(newErrors);
  };

  const deleteRow = (index) => {
    setEmployees((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => prev.filter((_, i) => i !== index));
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

      const formattedData = parsedData.map((row) => ({
        id: row.id || row.ID || "",
        name: row.name || row.Name || "",
        salary: row.salary || row.Salary || "",
        bank: row.bank || row.Bank || "",
        date: normalizeDate(row.date || row.Date || row.DateValue || ""),
      }));

      setEmployees((prev) => {
        const newEmployees = [...prev, ...formattedData];
        setErrors(newEmployees.map((emp) => getEmpErrors(emp)));
        return newEmployees;
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const hasErrors = () => {
    return errors.some((err) => err && Object.keys(err).length > 0);
  };

  const processBatch = () => {
    const allErrors = employees.map((emp) => getEmpErrors(emp));
    setErrors(allErrors);
    if (allErrors.some((e) => Object.keys(e).length > 0)) {
      alert("Please fix validation errors before processing batch.");
      return;
    }
    console.log("Processing Batch:", employees);
    alert("Batch processed successfully!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <Card elevation={3} style={{ padding: "20px" }}>
        <Typography variant="h4" sx={{ mb:2, fontWeight:'bold', color:'primary.main' }}>Payroll Processing</Typography>

        <div style={{ marginBottom: "16px" }}>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>

        <Button variant="contained" color="primary" onClick={addRow} style={{ marginBottom: "16px" }}>
          Add Employee
        </Button>

        <TableContainer component={Paper} style={{ marginBottom: "16px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Bank ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Enter Employee ID"
                      value={emp.id || ""}
                      onChange={(e) => updateEmployee(index, "id", e.target.value)}
                      error={!!errors[index]?.id}
                      helperText={errors[index]?.id}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Enter Full Name"
                      value={emp.name || ""}
                      onChange={(e) => updateEmployee(index, "name", e.target.value)}
                      error={!!errors[index]?.name}
                      helperText={errors[index]?.name}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      placeholder="Enter Salary (e.g. 50000)"
                      value={emp.salary || ""}
                      onChange={(e) => updateEmployee(index, "salary", e.target.value)}
                      error={!!errors[index]?.salary}
                      helperText={errors[index]?.salary}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Enter 7-digit Bank ID"
                      value={emp.bank || ""}
                      onChange={(e) => updateEmployee(index, "bank", e.target.value)}
                      error={!!errors[index]?.bank}
                      helperText={errors[index]?.bank}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Enter Date (yyyy-mm-dd)"
                      value={emp.date || ""}
                      onChange={(e) => updateEmployee(index, "date", e.target.value)}
                      error={!!errors[index]?.date}
                      helperText={errors[index]?.date}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" color="error" onClick={() => deleteRow(index)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button variant="contained" color="success" onClick={processBatch} disabled={hasErrors() || employees.length === 0}>
          Process Batch
        </Button>
      </Card>
    </div>
  );
}
