-- ENUMS (assuming these are enums based on names)
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'rejected', 'delivered');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE availability AS ENUM ('available', 'unavailable');

-- STUDENTS
CREATE TABLE students (
    student_number VARCHAR PRIMARY KEY,
    fname VARCHAR,
    lname VARCHAR,
    email TEXT
);

-- VENDORS
CREATE TABLE vendors (
    vendorid TEXT PRIMARY KEY,
    name VARCHAR,
    date_joined DATE,
    image_url TEXT,
    approval_status approval_status,
    email VARCHAR,
    availability availability
);

-- MENUITEMS
CREATE TABLE menuitems (
    menuitemid UUID PRIMARY KEY,
    vendorid TEXT REFERENCES vendors(vendorid),
    name VARCHAR,
    rating NUMERIC,
    created_at TIMESTAMP,
    in_stock NUMERIC,
    price NUMERIC
);

-- INGREDIENTS
CREATE TABLE ingredients (
    ingredientid UUID PRIMARY KEY,
    name TEXT
);

-- MENUITEM_INGREDIENTS
CREATE TABLE menuitem_ingredients (
    menuitemid UUID REFERENCES menuitems(menuitemid),
    ingredientid UUID REFERENCES ingredients(ingredientid),
    PRIMARY KEY (menuitemid, ingredientid)
);

-- CATEGORIES
CREATE TABLE categories (
    categoryid UUID PRIMARY KEY,
    name TEXT
);

-- MENUITEM_CATEGORIES
CREATE TABLE menuitem_categories (
    menuitemid UUID REFERENCES menuitems(menuitemid),
    categoryid UUID REFERENCES categories(categoryid),
    PRIMARY KEY (menuitemid, categoryid)
);

-- TIME_SLOT
CREATE TABLE time_slot (
    timeslotid INT PRIMARY KEY,
    timeslottime TIME
);

-- ORDERS
CREATE TABLE orders (
    orderid UUID PRIMARY KEY,
    student_number VARCHAR REFERENCES students(student_number),
    vendorid TEXT REFERENCES vendors(vendorid),
    order_status order_status,
    time_accepted TIMESTAMP,
    rating INT2,
    created_at TIMESTAMP,
    timeslotid INT REFERENCES time_slot(timeslotid)
);

-- ORDER_ITEMS
CREATE TABLE order_items (
    orderitemid UUID PRIMARY KEY,
    orderid UUID REFERENCES orders(orderid),
    menuitemid UUID REFERENCES menuitems(menuitemid),
    quantity INT
);

-- ADMINS
CREATE TABLE admins (
    id INT PRIMARY KEY,
    name VARCHAR,
    email VARCHAR
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    notifid UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ,
    sender UUID,
    recipient UUID,
    message TEXT,
    read BOOLEAN
);
