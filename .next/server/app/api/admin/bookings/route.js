"use strict";(()=>{var e={};e.id=602,e.ids=[602],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},3925:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>R,patchFetch:()=>A,requestAsyncStorage:()=>c,routeModule:()=>N,serverHooks:()=>l,staticGenerationAsyncStorage:()=>p});var s={};t.r(s),t.d(s,{DELETE:()=>d,GET:()=>T,PUT:()=>u});var n=t(9303),o=t(8716),a=t(670),i=t(7070),E=t(3810);async function T(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let r=await (0,E.N)(),t=await r.all(`
      SELECT b.*, s.name as serviceName, u.name as userName, u.email as userEmail
      FROM bookings b
      LEFT JOIN services s ON b.service = s.id
      LEFT JOIN users u ON b.phone = u.phone
      ORDER BY b.createdAt DESC
    `);return i.NextResponse.json({bookings:t})}catch(e){return console.error("Error fetching bookings:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function u(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{id:r,status:t,treatment_notes:s,...n}=await e.json();if(!r)return i.NextResponse.json({error:"Booking ID is required"},{status:400});let o=await (0,E.N)();if(t)await o.run("UPDATE bookings SET status = ? WHERE id = ?",[t,r]);else if(void 0!==s)await o.run("UPDATE bookings SET treatment_notes = ? WHERE id = ?",[s,r]);else{let{name:e,email:t,phone:s,service:a,date:i,time:E,message:T}=n;await o.run(`
        UPDATE bookings 
        SET name = ?, email = ?, phone = ?, service = ?, date = ?, time = ?, message = ?
        WHERE id = ?
      `,[e,t||null,s,a,i,E,T||null,r])}return i.NextResponse.json({message:"Booking updated successfully"})}catch(e){return console.error("Error updating booking:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:r}=new URL(e.url),t=r.get("id");if(!t)return i.NextResponse.json({error:"Booking ID is required"},{status:400});let s=await (0,E.N)();return await s.run("DELETE FROM bookings WHERE id = ?",[t]),i.NextResponse.json({message:"Booking deleted successfully"})}catch(e){return console.error("Error deleting booking:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}let N=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/bookings/route",pathname:"/api/admin/bookings",filename:"route",bundlePath:"app/api/admin/bookings/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\admin\\bookings\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:c,staticGenerationAsyncStorage:p,serverHooks:l}=N,R="/api/admin/bookings/route";function A(){return(0,a.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:p})}},3810:(e,r,t)=>{t.d(r,{N:()=>i});let s=require("sqlite3");var n=t.n(s),o=t(6360);let a=null;async function i(){return a||(a=await (0,o.bA)({filename:"./bookings.db",driver:n().Database}),await a.exec(`
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
    `),await a.exec(`
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
    `),await a.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await a.get("SELECT COUNT(*) as count FROM services")).count&&await a.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),a}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[948,972,360],()=>t(3925));module.exports=s})();