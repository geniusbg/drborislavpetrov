"use strict";(()=>{var e={};e.id=657,e.ids=[657],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},8007:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>p,patchFetch:()=>A,requestAsyncStorage:()=>N,routeModule:()=>u,serverHooks:()=>d,staticGenerationAsyncStorage:()=>c});var r={};s.r(r),s.d(r,{GET:()=>o});var i=s(9303),a=s(8716),T=s(670),E=s(7070),n=s(3810);async function o(){try{let e=await (0,n.N)(),t=(await e.all(`
      SELECT b.*, s.name as serviceName, u.name as userName
      FROM bookings b
      LEFT JOIN services s ON b.service = s.id
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.status = 'pending'
      ORDER BY b.createdAt DESC
      LIMIT 10
    `)).map(e=>({id:e.id,patientName:e.name,service:e.serviceName,date:e.date,time:e.time,status:e.status}));return E.NextResponse.json({success:!0,count:t.length,bookings:t,message:`Намерени са ${t.length} чакащи резервации`})}catch(e){return console.error("Siri get bookings error:",e),E.NextResponse.json({error:"Възникна грешка при получаване на резервациите"},{status:500})}}let u=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/siri/get-bookings/route",pathname:"/api/siri/get-bookings",filename:"route",bundlePath:"app/api/siri/get-bookings/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\get-bookings\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:N,staticGenerationAsyncStorage:c,serverHooks:d}=u,p="/api/siri/get-bookings/route";function A(){return(0,T.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:c})}},3810:(e,t,s)=>{s.d(t,{N:()=>E});let r=require("sqlite3");var i=s.n(r),a=s(6360);let T=null;async function E(){return T||(T=await (0,a.bA)({filename:"./bookings.db",driver:i().Database}),await T.exec(`
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
    `),await T.exec(`
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
    `),await T.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await T.get("SELECT COUNT(*) as count FROM services")).count&&await T.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),T}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[948,972,360],()=>s(8007));module.exports=r})();