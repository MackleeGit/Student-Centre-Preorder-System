import { supabase } from "./supabaseClient";
import { showErrorToast } from "../components/Toast/toastUtils.jsx";


// Check if user is logged in
export const checkAuth = async (navigate) => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    showErrorToast("Please login to continue using this service.", "Authentication Required");
    navigate("/login");
  }
};

// Register user
export const registerUser = async ({ role, email, password, extraFields }) => {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) throw signUpError;

  const userId = signUpData.user.id;

  try {
    if (role === "student") {
      const { error } = await supabase.from("students").insert({
        student_number: extraFields.studentId,
        fname: extraFields.fname,
        lname: extraFields.lname,
        email
      });
      if (error) throw error;
    } else if (role === "vendor") {
      const { error } = await supabase.from("vendors").insert({
        id: userId,
        name: extraFields.vendorName,
        email,

        /*Do this soon*/
        image_url: "Remember to add this",


        date_joined: new Date().toISOString().split("T")[0],
        approval_status: "pending"
      });
      if (error) throw error;
    }
  } catch (dbError) {
    //Rollback auth user if DB insert fails
    
  }
};

// Login user
export const loginUser = async ({ email, password, role, navigate }) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;

  if (role === "student") {
    navigate("/student/dashboard");
  } else if (role === "vendor") {
    navigate("/vendor/dashboard");
  }
};

// Logout
export const logoutUser = async (navigate) => {
  await supabase.auth.signOut();
  navigate("/login");
};


export const checkUserRole = async (expectedRole, navigate) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user?.email) {
        await showErrorToast("You are not logged in.");
        await logoutUser(navigate);
        return;
    }

    const email = authData.user.email;
    let tableName = "";
    let matchFound = false;

    switch (expectedRole.toLowerCase()) {
        case "student":
            tableName = "students";
            break;
        case "vendor":
            tableName = "vendors";
            break;
        case "admin":
            tableName = "admins";
            break;
        default:
            await showErrorToast("Invalid role specified.");
            await logoutUser(navigate);
            return;
    }

    const { data: userRecords, error: fetchError } = await supabase
        .from(tableName)
        .select("email")
        .eq("email", email)
        .maybeSingle();

    if (!userRecords || fetchError) {
        await showErrorToast("You are not authorized to access that page. Kindly log in again.");
        await logoutUser(navigate);
    }
};