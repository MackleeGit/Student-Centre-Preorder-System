import React, { useEffect, useState,useRef } from "react";
import { supabase } from "../utils/supabaseClient.js";
import { Search, UserCog,MoreVertical, Edit, Trash2 } from 'lucide-react';
import { showConfirmToast, showErrorToast, showSuccessToast } from '../components/Toast/toastUtils.jsx';
import "../css/dashboard.css";

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

     // --- State for Dropdown and Editing ---
    const [openMenuId, setOpenMenuId] = useState(null); // Tracks which student's action menu is open
    const [editingStudent, setEditingStudent] = useState(null); // Holds the data of the student being edited
    const menuRef = useRef(null);

    
        const fetchStudents = async () => {

            // FIX: We are only selecting the columns we know exist.
            const { data, error } = await supabase
                .from("students")
                .select("student_number, fname, lname, email");

            if (error) {
                console.error("Error fetching students:", error);
                setError("Could not load student data. Please check the database columns and RLS policies.");
            } else {
                setStudents(data);
            }
            setLoading(false);
        };

       useEffect(() => {
        fetchStudents();
    }, []);

     // --- Close dropdown menu if clicking outside ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

     // --- CRUD Functions ---

    const handleDeleteStudent = async (studentNumber, studentName) => {
        setOpenMenuId(null); // Close the menu
        const confirmed = await showConfirmToast(`Are you sure you want to delete the student: ${studentName}? This action cannot be undone.`);
        
        if (confirmed) {
            // First, delete from the 'students' profile table
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('student_number', studentNumber);

            if (error) {
                showErrorToast("Failed to delete student profile.");
                console.error("Delete Error:", error);
                
            }
            else{
               showSuccessToast("Student successfully deleted.");
            // ** THE FIX IS HERE: Re-fetch the data to update the UI instantly **
               fetchStudents();
            }

          }
    };
   

 const handleUpdateStudent = async () => {
        const { student_number, ...updateData } = editingStudent;
    
        const { error } = await supabase
          .from('students')
          .update({
        student_number: updateData.student_number,
        fname: updateData.fname,
        lname: updateData.lname,
        email: updateData.email
      })
          .eq('student_number', student_number);
    
        if (error) {
          showErrorToast("Failed to update student.");
          console.error("Update Error:", error);
        } else {
          showSuccessToast("Student updated successfully.");
         
          setEditingStudent(null);
          fetchStudents();
        }
    };
    
     // --- Event Handlers ---

    const startEditing = (student) => {
        setOpenMenuId(null);
        setEditingStudent({ ...student });
    };

    const cancelEditing = () => {
        setEditingStudent(null);
    };

    const onEditChange = (e) => {
        setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value });
    };



    // Filter students based on the search term
    const filteredStudents = students.filter(student =>
        (student.fname && student.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.lname && student.lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.student_number && student.student_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return <div>Loading student data...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Student Management</h3>
                <div className="input-with-icon" style={{ maxWidth: "300px" }}>
                    <Search className="input-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        className="input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="card-content">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student Number</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            {/* FIX: Temporarily removed "Date Joined" since we aren't fetching that data */}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    
                        {filteredStudents.map((student) => (
                            // Use the unique student_number for the key
                            <tr key={student.student_number}>
                                {editingStudent?.student_number === student.student_number ? (
                                    <>
                                        {/* Inline Editing Mode */}
                                        <td><input type="text" name="student_number" value={editingStudent.student_number} onChange={onEditChange} className="input-edit" readOnly /></td>
                                        <td><input type="text" name="fname" value={editingStudent.fname} onChange={onEditChange} className="input-edit" /></td>
                                        <td><input type="text" name="lname" value={editingStudent.lname} onChange={onEditChange} className="input-edit" /></td>
                                        <td><input type="email" name="email" value={editingStudent.email} onChange={onEditChange} className="input-edit" /></td>
                                
                                        <td style={{ textAlign: 'center' }}>
                                            <button onClick={handleUpdateStudent} className="btn btn-sm btn-success">Save</button>
                                            <button onClick={cancelEditing} className="btn btn-sm btn-secondary">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {/* Normal Display Mode */}
                                        <td>{student.student_number}</td>
                                        <td>{student.fname}</td>
                                        <td>{student.lname}</td>
                                        <td>{student.email}</td> 
                                
                                        <td style={{ textAlign: 'center' }} className="actions-cell">
                                            <button 
                                                className="btn btn-sm btn-primary btn-icon" 
                                                title="Manage Student"
                                                // Toggle the menu based on the student_number
                                                onClick={() => setOpenMenuId(student.student_number === openMenuId ? null : student.student_number)}
                                            >
                                                <UserCog size={16} />
                                            </button>
                                            {/* Show the menu if the openMenuId matches the student_number */}
                                            {openMenuId === student.student_number && (
                                                <div className="actions-dropdown" ref={menuRef}>
                                                    <button onClick={() => startEditing(student)}>
                                                        <Edit size={14} /> Update
                                                    </button>
                                                    <button onClick={() => handleDeleteStudent(student.student_number, `${student.fname} ${student.lname}`)} className="delete">
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentManagement;
