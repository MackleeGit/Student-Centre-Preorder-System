import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient.js";
import "../css/dashboard.css";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, fname, lname, student_number, email, date_joined")
        .order("date_joined", { ascending: false });

      if (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
      } else {
        setStudents(data);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <div>
      <div
        className="card-header"
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Student Management</h2>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Student Name</th>
                <th style={thStyle}>Student Number</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={tdStyle}>
                    {student.fname} {student.lname}
                  </td>
                  <td style={tdStyle}>{student.student_number}</td>
                  <td style={tdStyle}>{student.email}</td>
                  <td style={tdStyle}>{new Date(student.date_joined).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  textAlign: "left",
  padding: "12px 8px",
  borderBottom: "2px solid var(--border)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export default StudentManagement;
