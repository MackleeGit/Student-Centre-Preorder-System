import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient.js";
import { Search, UserCog, Edit, Trash2 } from 'lucide-react';
import { showConfirmToast, showErrorToast, showSuccessToast } from '../components/Toast/toastUtils.jsx';
import "../css/dashboard.css";

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const menuRef = useRef(null);

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from("students")
            .select("user_id, student_number, fname, lname, email")
            .order('fname', { ascending: true });

        if (error) {
            console.error("Error fetching students:", error);
            setError("Could not load student data. Please check table columns and RLS policies.");
        } else {
            setStudents(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStudents();
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenuId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- SECURE CRUD FUNCTIONS ---

    const handleDeleteStudent = async (student, studentName) => {
        setOpenMenuId(null);
        if (!student?.user_id) {
            showErrorToast("Cannot delete: Missing authentication link.");
            return;
        }
        const confirmed = await showConfirmToast(`Delete ${studentName}? This is permanent and deletes their login.`);
        
        if (confirmed) {
            const { error } = await supabase.rpc('manage_student_securely', {
                action: 'delete',
                auth_user_id: student.user_id,
                student_num: student.student_number,
                update_data: {}
            });

            if (error) {
                showErrorToast("Failed to delete student.");
                console.error("Delete Error:", error);
            } else {
                showSuccessToast("Student successfully deleted.");
                fetchStudents();
            }
        }
    };

    const handleUpdateStudent = async () => {
        const { user_id: authUserId, student_number: studentNum, ...updateData } = editingStudent;
        
        if (!authUserId) {
            showErrorToast("Cannot update: Missing authentication link.");
            return;
        }
    
        // CHANGE 1: We explicitly create the update object and DO NOT include the email.
        const { error } = await supabase.rpc('manage_student_securely', {
            action: 'update',
            auth_user_id: authUserId,
            student_num: studentNum,
            update_data: {
                fname: updateData.fname,
                lname: updateData.lname
                // Note: Email is intentionally left out
            }
        });
    
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
    const startEditing = (student) => setEditingStudent({ ...student });
    const cancelEditing = () => setEditingStudent(null);
    const onEditChange = (e) => setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value });
    
    const filteredStudents = students.filter(student => {
        if (!student) return false;
        return Object.values(student).some(val => 
            String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    });

    if (loading) return <div>Loading student data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <>
            <div className="card-header">
                <h3 className="card-title">Student Management</h3>
                <div className="input-with-icon" style={{ maxWidth: "300px" }}>
                    <Search className="input-icon" size={16} />
                    <input type="text" placeholder="Search students..." className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
<<<<<<< Updated upstream
                    
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
=======
                        {filteredStudents.map((student) => {
                            if (!student) return null;
                            return (
                                <tr key={student.student_number}>
                                    {editingStudent?.student_number === student.student_number ? (
                                        <>
                                            <td><input type="text" name="student_number" value={editingStudent.student_number} className="input-edit" readOnly /></td>
                                            <td><input type="text" name="fname" value={editingStudent.fname ?? ''} onChange={onEditChange} className="input-edit" /></td>
                                            <td><input type="text" name="lname" value={editingStudent.lname ?? ''} onChange={onEditChange} className="input-edit" /></td>
                                            {/* CHANGE 2: Added the 'readOnly' attribute to the email input field */}
                                            <td><input type="email" name="email" value={editingStudent.email ?? ''} className="input-edit" readOnly title="Login email cannot be changed here."/></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={handleUpdateStudent} className="btn btn-sm btn-success">Save</button>
                                                <button onClick={cancelEditing} className="btn btn-sm btn-secondary">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{student.student_number}</td>
                                            <td>{student.fname}</td>
                                            <td>{student.lname}</td>
                                            <td>{student.email}</td>
                                            <td style={{ textAlign: 'center' }} className="actions-cell">
                                                <button className="btn btn-sm btn-outline btn-icon" title="Manage Student" onClick={() => setOpenMenuId(student.student_number === openMenuId ? null : student.student_number)}>
                                                    <UserCog size={16} />
                                                </button>
                                                {openMenuId === student.student_number && (
                                                    <div className="actions-dropdown" ref={menuRef}>
                                                        <button onClick={() => startEditing(student)}><Edit size={14} /> Update</button>
                                                        <button onClick={() => handleDeleteStudent(student, `${student.fname} ${student.lname}`)} className="delete"><Trash2 size={14} /> Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
>>>>>>> Stashed changes
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default StudentManagement;
