import React, { useState, useEffect } from "react";
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
  const [payments, setPayments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [batchId, setBatchId] = useState(() => Date.now().toString()); // editable Batch ID

  const getToday = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  // auto-fill current date in existing rows on first render
  useEffect(() => {
    if (payments.length === 0) return;
    setPayments((prev) =>
      prev.map((pmt) => ({
        ...pmt,
        date: pmt.date ? pmt.date : getToday(),
      }))
    );
  }, []);

  const getPaymentErrors = (pmt) => {
    const pmtErrors = {};
    if (!pmt.date || !/^\d{4}-\d{2}-\d{2}$/.test(pmt.date)) {
      pmtErrors.date = "Date must be in yyyy-mm-dd format";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateValue = new Date(pmt.date);
      if (isNaN(dateValue.getTime())) {
        pmtErrors.date = "Invalid date";
      } else if (dateValue < today) {
        pmtErrors.date = "Date cannot be in the past";
      }
    }
    if (!pmt.debitAccount) pmtErrors.debitAccount = "Debit Account is required";
    if (!pmt.creditAccount) pmtErrors.creditAccount = "Credit Account is required";
    if (!pmt.debitCurrency) pmtErrors.debitCurrency = "Debit Currency is required";
    if (!pmt.creditCurrency) pmtErrors.creditCurrency = "Credit Currency is required";
    if (!pmt.debitAmount || isNaN(pmt.debitAmount) || Number(pmt.debitAmount) <= 0) pmtErrors.debitAmount = "Valid Debit Amount is required";
    if (!pmt.employeeName || !/^[A-Za-z ]+$/.test(pmt.employeeName)) pmtErrors.employeeName = "Employee Name must contain only alphabets";
    if (!pmt.bankId || !/^\d{7}$/.test(pmt.bankId)) pmtErrors.bankId = "Bank ID must be exactly 7 digits";
    return pmtErrors;
  };

  const addRow = () => {
    const today = getToday();
    const newPmt = { batchId, date: today, debitAccount: "", creditAccount: "", debitCurrency: "", debitAmount: "", creditCurrency: "", employeeName: "", bankId: "", remarks: "" };
    setPayments((prev) => [...prev, newPmt]);
    setErrors((prev) => [...prev, getPaymentErrors(newPmt)]);
  };

  const updatePayment = (index, field, value) => {
    const updated = [...payments];
    updated[index][field] = value;
    setPayments(updated);

    const newErrors = [...errors];
    newErrors[index] = getPaymentErrors(updated[index]);
    setErrors(newErrors);
  };

  const deleteRow = (index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
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
        batchId,
        date: row.date || row.Date || getToday(),
        debitAccount: row.debitAccount || "",
        creditAccount: row.creditAccount || "",
        debitCurrency: row.debitCurrency || "",
        debitAmount: row.debitAmount || "",
        creditCurrency: row.creditCurrency || "",
        employeeName: row.employeeName || "",
        bankId: row.bankId || "",
        remarks: row.remarks || ""
      }));

      setPayments((prev) => {
        const newPayments = [...prev, ...formattedData];
        setErrors(newPayments.map((pmt) => getPaymentErrors(pmt)));
        return newPayments;
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const hasErrors = () => {
    return errors.some((err) => err && Object.keys(err).length > 0);
  };

  const processBatch = () => {
    const allErrors = payments.map((pmt) => getPaymentErrors(pmt));
    setErrors(allErrors);
    if (allErrors.some((e) => Object.keys(e).length > 0)) {
      alert("Please fix validation errors before processing batch.");
      return;
    }
    console.log("Processing Batch ID:", batchId, "Payments:", payments);
    alert(`Batch ${batchId} processed successfully!`);
  };

  const handleBatchIdChange = (e) => {
    const newBatchId = e.target.value;
    setBatchId(newBatchId);
    setPayments((prev) => prev.map((pmt) => ({ ...pmt, batchId: newBatchId })));
  };

  return (
    <div style={{ padding: "20px" }}>
      <Card elevation={3} style={{ padding: "20px" }}>
        <Typography variant="h4" sx={{ mb:2, fontWeight:'bold', color:'primary.main' }}>Payroll Payments</Typography>

        <div style={{ marginBottom: "16px" }}>
          <TextField
            label="Batch ID"
            variant="outlined"
            size="small"
            value={batchId}
            onChange={handleBatchIdChange}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>

        <Button variant="contained" color="primary" onClick={addRow} style={{ marginBottom: "16px" }}>
          Add Row
        </Button>

        <TableContainer component={Paper} style={{ marginBottom: "16px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Debit Account</TableCell>
                <TableCell>Credit Account</TableCell>
                <TableCell>Debit Currency</TableCell>
                <TableCell>Debit Amount</TableCell>
                <TableCell>Credit Currency</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Bank ID</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((pmt, index) => (
                <TableRow key={index}>
                  {Object.keys(pmt).map((field) => (
                    <TableCell key={field}>
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder={`Enter ${field}`}
                        value={pmt[field] || ""}
                        onChange={(e) => updatePayment(index, field, e.target.value)}
                        error={!!errors[index]?.[field]}
                        helperText={errors[index]?.[field]}
                        InputProps={{ 
                          readOnly: field === "batchId" || field === "date" 
                        }}
                      />
                    </TableCell>
                  ))}
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

        <Button variant="contained" color="success" onClick={processBatch} disabled={hasErrors() || payments.length === 0}>
          Process Batch
        </Button>
      </Card>
    </div>
  );
}