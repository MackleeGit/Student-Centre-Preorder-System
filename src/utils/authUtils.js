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

  // This is the unique ID from the auth.users table
  const userId = signUpData.user.id; 

  try {
    if (role === "student") {
      // --- THE FIX IS HERE ---
      // We now correctly include the 'user_id' when inserting the new student profile.
      const { error } = await supabase.from("students").insert({
        user_id: userId, // This creates the crucial link
        student_number: extraFields.studentId,
        fname: extraFields.fname,
        lname: extraFields.lname,
        email: email
      });
      if (error) throw error;
    } else if (role === "vendor") {
      let bannerUrl = null;

      // Upload banner to Supabase storage if provided
      if (extraFields.banner) {
        const fileExt = extraFields.banner.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vendors')
          .upload(fileName, extraFields.banner);

        if (uploadError) {
          console.error('Banner upload error:', uploadError);
          throw new Error('Failed to upload banner image');
        }

        // Get the public URL for the uploaded banner
        const { data: urlData } = supabase.storage
          .from('vendors')
          .getPublicUrl(fileName);
        
        bannerUrl = urlData.publicUrl;
      }

      // the same for vendors
      const { error } = await supabase.from("vendors").insert({
        vendorid: userId, // Also add the user_id link for vendors
        name: extraFields.vendorName,
        email: email,
        banner_url: bannerUrl,
        description: extraFields.description || "", //Description
        // ... other vendor fields
      });
      if (error) throw error;
    }
  } catch (dbError) {
    // If saving the profile fails, we should delete the auth user we just created.
    // This prevents "zombie" auth accounts that have no profile.
    await supabase.auth.admin.deleteUser(userId);
    console.error("Database insert failed, rolling back auth user.");
    throw dbError;
  }
};

// Login user
export const loginUser = async ({ unameemail, password, role, navigate }) => {
  try {
    let validEmail = null;

    // ---  Pre-check based on role ---
    if (role === "student") {
      if (unameemail.includes("@")) {
        // Search by email
        const { data: student, error } = await supabase
          .from("students")
          .select("email")
          .eq("email", unameemail)
          .single();

        if (error || !student) throw new Error("No student with that email");
        validEmail = student.email;

      } else {
        // Search by student number
        const { data: student, error } = await supabase
          .from("students")
          .select("email")
          .eq("student_number", unameemail)
          .single();

        if (error || !student) throw new Error("Student number not found");
        validEmail = student.email;
      }
    }

    else if (role === "vendor") {
      const { data: vendor, error } = await supabase
        .from("vendors")
        .select("email")
        .eq("email", unameemail)
        .single();

      if (error || !vendor) throw new Error("No vendor with that email");
      validEmail = vendor.email;
    }

    else if (role === "admin") {
      const { data: admin, error } = await supabase
        .from("admins")
        .select("email")
        .eq("email", unameemail)
        .single();

      if (error || !admin) throw new Error("No admin with that email");
      validEmail = admin.email;
    }

    // --- Sign in using validated email ---
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: validEmail,
      password,
    });

    if (signInError) throw signInError;

    // ---  Route to dashboard based on role ---
    if (role === "student") {
      navigate("/student/dashboard");
    } else if (role === "vendor") {
      navigate("/vendor/dashboard");
    } else {
      navigate("/admin/dashboard");
    }

  } catch (err) {
    throw err;
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