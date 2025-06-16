
import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { useNavigate } from "react-router-dom";

// Minimal icon JSX (no shadcn, no lucide import)
const PencilIcon = () => (
  <svg height="18" width="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
);
const TrashIcon = () => (
  <svg height="18" width="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3-3h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z" /></svg>
);

export default function ViewMenu() {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ menuitemid: null, name: "", price: "", description: "", in_stock: "", categories: [], ingredients: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", price: "", description: "", in_stock: "", categories: [], ingredients: [] });
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const navigate = useNavigate();

  // Modal scroll lock
  useEffect(() => {
    if (showEdit || showCreate || showDeleteConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [showEdit, showCreate, showDeleteConfirm]);

  useEffect(() => {
    fetchVendor();
    // eslint-disable-next-line
  }, []);

  const fetchVendor = async () => {
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user?.email) {
      console.error("Auth error", authError);
      navigate("/login");
      return;
    }
    const email = user.user.email;
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendorid, name")
      .eq("email", email)
      .maybeSingle();
    if (vendorError || !vendor) {
      console.error("Vendor not found", vendorError);
      navigate("/login");
      return;
    }
    setUserData(vendor);
    setLoadingUser(false);
  };

  useEffect(() => {
    if (userData?.vendorid) {
      fetchMenu();
      fetchCategories();
      fetchIngredients();
    }
    // eslint-disable-next-line
  }, [userData]);

  // Get menuitems INCLUDING categories, ingredients
  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menuitems")
      .select(`
        *,
        menuitem_categories (
          categoryid,
          categories (
            name
          )
        ),
        menuitem_ingredients (
          ingredientid,
          ingredients (
            name
          )
        )
      `)
      .eq("vendorid", userData.vendorid);

    if (error) {
      showErrorToast(error.message || "Could not load menu");
    } else {
      setMenuItems(
        (data || []).map((item) => ({
          ...item,
          categories: item.menuitem_categories?.map(mc =>
            ({ categoryid: mc.categoryid, name: mc.categories?.name })) || [],
          ingredients: item.menuitem_ingredients?.map(mi =>
            ({ ingredientid: mi.ingredientid, name: mi.ingredients?.name })) || []
        }))
      );
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };
  const fetchIngredients = async () => {
    const { data, error } = await supabase.from("ingredients").select("*");
    setIngredients(data || []);
  };

  // Select logic
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedIds(menuItems.map(i => i.menuitemid));
  const clearSelection = () => setSelectedIds([]);

  // -------- CREATE MENU ITEM --------
  const handleCreateForm = e => {
    setCreateForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleCreateMultiSelect = (listName, val) => {
    setCreateForm(f => ({
      ...f,
      [listName]: f[listName].includes(val)
        ? f[listName].filter(id => id !== val)
        : [...f[listName], val]
    }));
  };
  const saveCreate = async () => {
    if (!createForm.name || !createForm.price || isNaN(Number(createForm.price))) {
      showErrorToast("Name and valid price required.");
      return;
    }
    // Create menuitem
    const { data, error } = await supabase
      .from("menuitems")
      .insert({
        vendorid: userData.vendorid,
        name: createForm.name,
        price: parseFloat(createForm.price),
        in_stock: createForm.in_stock || null,
        description: createForm.description,
        created_at: new Date().toISOString()
      })
      .select("menuitemid")
      .maybeSingle();

    if (error || !data) {
      showErrorToast(error?.message || "Error creating menu item.");
      return;
    }

    // Link to categories/ingredients many-to-many
    const menuitemid = data.menuitemid;
    if (createForm.categories.length > 0) {
      await supabase.from("menuitem_categories").insert(
        createForm.categories.map(cid => ({ menuitemid, categoryid: cid }))
      );
    }
    if (createForm.ingredients.length > 0) {
      await supabase.from("menuitem_ingredients").insert(
        createForm.ingredients.map(iid => ({ menuitemid, ingredientid: iid }))
      );
    }

    showSuccessToast("Menu item created!");
    setShowCreate(false);
    setCreateForm({ name: "", price: "", in_stock: "", description: "", categories: [], ingredients: [] });
    fetchMenu();
  };

  // -------- EDIT MENU ITEM --------
  const handleEditClick = (item) => {
    setEditForm({
      menuitemid: item.menuitemid,
      name: item.name,
      price: item.price ? String(item.price) : "",
      description: item.description || "",
      in_stock: item.in_stock || "",
      categories: item.categories.map(c => c.categoryid),
      ingredients: item.ingredients.map(i => i.ingredientid)
    });
    setShowEdit(true);
  };
  const handleEditForm = e => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleEditMultiSelect = (listName, val) => {
    setEditForm(f => ({
      ...f,
      [listName]: f[listName].includes(val)
        ? f[listName].filter(id => id !== val)
        : [...f[listName], val]
    }));
  };
  const saveEdit = async () => {
    if (!editForm.name || !editForm.price || isNaN(Number(editForm.price))) {
      showErrorToast("Name and valid price required.");
      return;
    }
    // Update menuitem
    const { error } = await supabase
      .from("menuitems")
      .update({
        name: editForm.name,
        price: parseFloat(editForm.price),
        description: editForm.description,
        in_stock: editForm.in_stock || null
      })
      .eq("menuitemid", editForm.menuitemid);

    if (error) {
      showErrorToast(error.message || "Error updating.");
      return;
    }

    // Unlink previous categories/ingredients
    await supabase.from("menuitem_categories")
      .delete()
      .eq("menuitemid", editForm.menuitemid);
    await supabase.from("menuitem_ingredients")
      .delete()
      .eq("menuitemid", editForm.menuitemid);

    // Insert selected
    if (editForm.categories.length > 0) {
      await supabase.from("menuitem_categories").insert(
        editForm.categories.map(cid => ({ menuitemid: editForm.menuitemid, categoryid: cid }))
      );
    }
    if (editForm.ingredients.length > 0) {
      await supabase.from("menuitem_ingredients").insert(
        editForm.ingredients.map(iid => ({ menuitemid: editForm.menuitemid, ingredientid: iid }))
      );
    }

    showSuccessToast("Menu item updated!");
    setShowEdit(false);
    fetchMenu();
  };

  // DELETE logic
  const confirmDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = await showConfirmToast(`Delete ${selectedIds.length} selected item(s)?`);
    if (!confirm) return;
    setShowDeleteConfirm(false);

    // Delete category/ingredient links for each item (FK clean)
    for (const id of selectedIds) {
      await supabase.from("menuitem_categories").delete().eq("menuitemid", id);
      await supabase.from("menuitem_ingredients").delete().eq("menuitemid", id);
      await supabase.from("menuitems").delete().eq("menuitemid", id);
    }

    showSuccessToast("Menu items deleted.");
    setSelectedIds([]);
    fetchMenu();
  };

  // Filter/search logic
  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loadingUser)
    return <div style={{ minHeight: "100vh" }}>Loading vendor...</div>;

  // Styles for a spanning grid
  const cardGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
    gap: "2rem",
    marginTop: "1.5rem"
  };
  const modalStyle = {
    minWidth: 400,
    width: "100%",
    maxWidth: 680,
    padding: "var(--spacing-8)",
    position: "relative",
    background: "var(--card)",
    borderRadius: "1.25rem",
    boxShadow: "0 6px 36px rgba(0,0,0,0.13)"
  };
  const fakeScrollStyle = {
    maxHeight: 180,
    overflowY: "auto",
    border: "1px solid var(--border)",
    padding: "0.5rem",
    borderRadius: 10,
    background: "var(--muted)"
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <Toaster position="top-right" />
      <div className="header">
        <div className="container flex items-center justify-between">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1 className="header-title">View & Manage Menu</h1>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreate(true)}
            style={{ minWidth: 150, fontSize: 18, fontWeight: 700 }}
          >
            + Add Menu Item
          </button>
        </div>
      </div>
      <div className="container" style={{ marginTop: "var(--spacing-6)" }}>
        <div className="flex justify-between items-center gap-4" style={{ marginBottom: "var(--spacing-4)" }}>
          <div className="input-with-icon" style={{ maxWidth: 400 }}>
            <span className="input-icon" style={{ left: "var(--spacing-3)", fontSize: 20 }}>🔍</span>
            <input
              className="input"
              placeholder="Search menu items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem", width: 320, fontSize: 17, height: 42 }}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={selectAll} disabled={menuItems.length === 0}>
              Select All
            </button>
            <button className="btn btn-outline btn-sm" onClick={clearSelection} disabled={selectedIds.length === 0}>
              Clear
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ color: selectedIds.length ? "var(--destructive)" : undefined }}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedIds.length === 0}>
              <TrashIcon /> Delete Selected
            </button>
          </div>
        </div>

        {loading ? <p>Loading menu...</p> : (
          <div style={cardGridStyle}>
            {filteredItems.map(item => (
              <div
                key={item.menuitemid}
                className="card"
                style={{
                  border: selectedIds.includes(item.menuitemid)
                    ? "2.5px solid var(--primary)"
                    : "1.2px solid var(--border)",
                  background: selectedIds.includes(item.menuitemid)
                    ? "rgba(31, 41, 55, 0.08)"
                    : "var(--card)",
                  position: "relative",
                  transition: "all 0.2s",
                  minHeight: 160,
                  display: "flex",
                  flexDirection: "column",
                  padding: "2.2rem",
                  fontSize: 17
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.menuitemid)}
                  onChange={() => toggleSelect(item.menuitemid)}
                  style={{
                    position: "absolute", top: 20, right: 20, width: 24, height: 24, cursor: "pointer"
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.32rem", lineHeight: "140%" }}>{item.name}</h3>
                  <div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleEditClick(item)}
                    >
                      <PencilIcon /> Edit
                    </button>
                  </div>
                </div>
                <p style={{ color: "var(--muted-foreground)", fontSize: 16, marginBottom: 12, minHeight: 28 }}>
                  {item.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    display: "inline-block",
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    borderRadius: 7,
                    padding: "2px 14px",
                    fontWeight: 600
                  }}>
                    ${item.price}
                  </span>
                  <span style={{
                    display: "inline-block",
                    background: "var(--secondary)",
                    color: "var(--secondary-foreground)",
                    borderRadius: 7,
                    padding: "2px 10px",
                    fontWeight: 500
                  }}>
                    {item.in_stock === "in_stock" ? "In Stock" : item.in_stock === "out_of_stock" ? "Out of Stock" : "Unknown"}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Categories:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {item.categories.map(c =>
                      <span key={c.categoryid} style={{
                        display: "inline-block", background: "#F2F5FA", color: "#355", fontWeight: 600, borderRadius: 6, padding: "0 11px"
                      }}>{c.name}</span>
                    )}
                    {item.categories.length === 0 && <span style={{ color: "#AAAAAA" }}>None</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Ingredients:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {item.ingredients.map(i =>
                      <span key={i.ingredientid} style={{
                        display: "inline-block", background: "#FAF2F2", color: "#533", fontWeight: 500, borderRadius: 6, padding: "0 11px"
                      }}>{i.name}</span>
                    )}
                    {item.ingredients.length === 0 && <span style={{ color: "#AAAAAA" }}>None</span>}
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <div style={{ fontSize: 20, opacity: 0.8 }}>No menu items found.</div>}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.39)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2200
          }}
        >
          <div className="card" style={modalStyle}>
            <h3 className="card-title" style={{ marginBottom: 30, fontSize: 23 }}>
              Add Menu Item
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <input
                  className="input"
                  placeholder="Name"
                  name="name"
                  value={createForm.name}
                  onChange={handleCreateForm}
                  style={{ marginBottom: 20, width: "100%", fontSize: 18, height: 44 }}
                />
                <input
                  className="input"
                  placeholder="Price"
                  name="price"
                  type="number"
                  value={createForm.price}
                  onChange={handleCreateForm}
                  min="0"
                  style={{ marginBottom: 20, width: "100%", fontSize: 18, height: 44 }}
                />
                <select
                  className="input"
                  name="in_stock"
                  value={createForm.in_stock}
                  onChange={handleCreateForm}
                  style={{ marginBottom: 20, width: "100%", fontSize: 18, height: 44 }}
                >
                  <option value="">Select Stock Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
                <textarea
                  className="input"
                  placeholder="Description"
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateForm}
                  style={{ marginBottom: 18, width: "100%", minHeight: 74, fontSize: 17, resize: "vertical" }}
                />
              </div>
              <div>
                <div style={{ marginBottom: 17 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Categories</label>
                  <div style={fakeScrollStyle}>
                    {categories.map(cat => (
                      <button
                        key={cat.categoryid}
                        onClick={() => handleCreateMultiSelect("categories", cat.categoryid)}
                        className={createForm.categories.includes(cat.categoryid)
                          ? "btn btn-primary btn-sm"
                          : "btn btn-outline btn-sm"}
                        type="button"
                        style={{
                          margin: 4,
                          minWidth: 100,
                          fontWeight: 550
                        }}
                      >{cat.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Ingredients</label>
                  <div style={fakeScrollStyle}>
                    {ingredients.map(ing => (
                      <button
                        key={ing.ingredientid}
                        onClick={() => handleCreateMultiSelect("ingredients", ing.ingredientid)}
                        className={createForm.ingredients.includes(ing.ingredientid)
                          ? "btn btn-primary btn-sm"
                          : "btn btn-outline btn-sm"}
                        type="button"
                        style={{
                          margin: 4,
                          minWidth: 100,
                          fontWeight: 500
                        }}
                      >{ing.name}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end" style={{ marginTop: 28 }}>
              <button className="btn btn-primary btn-sm" onClick={saveCreate} style={{ minWidth: 80, fontSize: 16 }}>Save</button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)} style={{ minWidth: 80, fontSize: 16 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.37)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1800
          }}>
          <div className="card" style={modalStyle}>
            <h3 className="card-title" style={{ marginBottom: 30, fontSize: 23 }}>
              Edit Menu Item
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <input
                  className="input"
                  placeholder="Name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditForm}
                  style={{ marginBottom: 20, width: "100%", fontSize: 18, height: 44 }}
                />
                <input
                  className="input"
                  placeholder="Price"
                  name="price"
                  type="number"
                  value={editForm.price}
                  onChange={handleEditForm}
                  min="0"
                  style={{ marginBottom: 20, width: "100%", fontSize: 18, height: 44 }}
                />
                <select
                  className="input"
                  name="in_stock"
                  value={editForm.in_stock}
                  onChange={handleEditForm}
                  style={{ marginBottom: 20, width: "100%", fontSize: 18, height: 44 }}
                >
                  <option value="">Select Stock Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
                <textarea
                  className="input"
                  placeholder="Description"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditForm}
                  style={{ marginBottom: 18, width: "100%", minHeight: 74, fontSize: 17, resize: "vertical" }}
                />
              </div>
              <div>
                <div style={{ marginBottom: 17 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Categories</label>
                  <div style={fakeScrollStyle}>
                    {categories.map(cat => (
                      <button
                        key={cat.categoryid}
                        onClick={() => handleEditMultiSelect("categories", cat.categoryid)}
                        className={editForm.categories.includes(cat.categoryid)
                          ? "btn btn-primary btn-sm"
                          : "btn btn-outline btn-sm"}
                        type="button"
                        style={{
                          margin: 4,
                          minWidth: 100,
                          fontWeight: 550
                        }}
                      >{cat.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Ingredients</label>
                  <div style={fakeScrollStyle}>
                    {ingredients.map(ing => (
                      <button
                        key={ing.ingredientid}
                        onClick={() => handleEditMultiSelect("ingredients", ing.ingredientid)}
                        className={editForm.ingredients.includes(ing.ingredientid)
                          ? "btn btn-primary btn-sm"
                          : "btn btn-outline btn-sm"}
                        type="button"
                        style={{
                          margin: 4,
                          minWidth: 100,
                          fontWeight: 500
                        }}
                      >{ing.name}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end" style={{ marginTop: 28 }}>
              <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ minWidth: 80, fontSize: 16 }}>Save</button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(false)} style={{ minWidth: 80, fontSize: 16 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1111
          }}>
          <div className="card"
            style={{
              minWidth: 340,
              padding: "var(--spacing-6)",
              background: "var(--card)",
              textAlign: "center"
            }}>
            <h3 style={{ fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
              Delete {selectedIds.length} menu item{selectedIds.length > 1 ? "s" : ""}?
            </h3>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "var(--spacing-6)" }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button className="btn btn-outline btn-sm" style={{ color: "var(--destructive)" }}
                onClick={confirmDelete}
              >Confirm</button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}