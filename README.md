# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Database Setup (XAMPP)

To run the backend locally, you need to set up a MySQL database. We recommend using XAMPP.

1. **Download and Install XAMPP**: 
   - Download XAMPP from [apachefriends.org](https://www.apachefriends.org/index.html) and install it on your system.
2. **Start MySQL Module**: 
   - Open the XAMPP Control Panel.
   - Click the "Start" button next to the **MySQL** module.
3. **Open phpMyAdmin**: 
   - Once MySQL is running, click the "Admin" button next to it, or navigate to `http://localhost/phpmyadmin` in your web browser.
4. **Create the Database**: 
   - In phpMyAdmin, click on "New" in the left sidebar to create a new database.
   - Enter `duyanan_db` as the database name.
   - Click the "Create" button.
5. **Run the Backend**: 
   - The Spring Boot backend uses `spring.jpa.hibernate.ddl-auto=update`, which means it will automatically create all the necessary tables for you when you run the application. No manual SQL scripts are required!
