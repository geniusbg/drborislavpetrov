"use strict";(()=>{var e={};e.id=628,e.ids=[628],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6706:(e,r,s)=>{s.r(r),s.d(r,{originalPathname:()=>A,patchFetch:()=>U,requestAsyncStorage:()=>l,routeModule:()=>N,serverHooks:()=>R,staticGenerationAsyncStorage:()=>c});var t={};s.r(t),s.d(t,{DELETE:()=>p,GET:()=>E,POST:()=>T,PUT:()=>d});var n=s(9303),a=s(8716),o=s(670),i=s(7070),u=s(3810);async function E(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let r=await (0,u.N)(),s=await r.all("SELECT * FROM users ORDER BY name");return i.NextResponse.json({users:s})}catch(e){return console.error("Error fetching users:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function T(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{name:r,email:s,phone:t,address:n,notes:a}=await e.json();if(!r||!t)return i.NextResponse.json({error:"Name and phone are required"},{status:400});let o=await (0,u.N)();if(await o.get("SELECT * FROM users WHERE phone = ?",[t]))return i.NextResponse.json({error:"User with this phone number already exists"},{status:409});let E=await o.run(`
      INSERT INTO users (name, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `,[r,s||null,t,n||null,a||null]);return i.NextResponse.json({message:"User created successfully",userId:E.lastID})}catch(e){return console.error("Error creating user:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{id:r,name:s,email:t,phone:n,address:a,notes:o}=await e.json();if(!r||!s||!n)return i.NextResponse.json({error:"ID, name and phone are required"},{status:400});let E=await (0,u.N)();if(await E.get("SELECT * FROM users WHERE phone = ? AND id != ?",[n,r]))return i.NextResponse.json({error:"Phone number is already used by another user"},{status:409});return await E.run(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?, address = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,[s,t||null,n,a||null,o||null,r]),i.NextResponse.json({message:"User updated successfully"})}catch(e){return console.error("Error updating user:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function p(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:r}=new URL(e.url),s=r.get("id");if(!s)return i.NextResponse.json({error:"User ID is required"},{status:400});let t=await (0,u.N)();if((await t.get("SELECT COUNT(*) as count FROM bookings WHERE phone = (SELECT phone FROM users WHERE id = ?)",[s])).count>0)return i.NextResponse.json({error:"Cannot delete user with existing bookings"},{status:400});return await t.run("DELETE FROM users WHERE id = ?",[s]),i.NextResponse.json({message:"User deleted successfully"})}catch(e){return console.error("Error deleting user:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}let N=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/users/route",pathname:"/api/admin/users",filename:"route",bundlePath:"app/api/admin/users/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\admin\\users\\route.ts",nextConfigOutput:"",userland:t}),{requestAsyncStorage:l,staticGenerationAsyncStorage:c,serverHooks:R}=N,A="/api/admin/users/route";function U(){return(0,o.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:c})}},3810:(e,r,s)=>{s.d(r,{N:()=>i});let t=require("sqlite3");var n=s.n(t),a=s(6360);let o=null;async function i(){return o||(o=await (0,a.bA)({filename:"./bookings.db",driver:n().Database}),await o.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        service INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),await o.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT UNIQUE NOT NULL,
        address TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),await o.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await o.get("SELECT COUNT(*) as count FROM services")).count&&await o.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),o}}};var r=require("../../../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),t=r.X(0,[948,972,360],()=>s(6706));module.exports=t})();