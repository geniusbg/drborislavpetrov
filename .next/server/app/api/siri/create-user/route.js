"use strict";(()=>{var e={};e.id=899,e.ids=[899],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},5008:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>d,patchFetch:()=>A,requestAsyncStorage:()=>N,routeModule:()=>u,serverHooks:()=>p,staticGenerationAsyncStorage:()=>c});var s={};t.r(s),t.d(s,{POST:()=>o});var a=t(9303),T=t(8716),i=t(670),E=t(7070),n=t(3810);async function o(e){try{let{patientName:r,phone:t,email:s}=await e.json();if(!r)return E.NextResponse.json({error:"Липсва име на потребителя"},{status:400});let a=await (0,n.N)(),T=t||"+359888000000";if(await a.get("SELECT * FROM users WHERE name = ? OR phone = ?",[r,T]))return E.NextResponse.json({error:`Потребителят ${r} вече съществува`},{status:409});let i=await a.run(`
      INSERT INTO users (name, phone, email)
      VALUES (?, ?, ?)
    `,[r,T,s||null]);return E.NextResponse.json({success:!0,message:`Потребителят ${r} е създаден успешно. Телефон: ${T}`,userId:i.lastID})}catch(e){return console.error("Siri create user error:",e),E.NextResponse.json({error:"Възникна грешка при създаване на потребителя"},{status:500})}}let u=new a.AppRouteRouteModule({definition:{kind:T.x.APP_ROUTE,page:"/api/siri/create-user/route",pathname:"/api/siri/create-user",filename:"route",bundlePath:"app/api/siri/create-user/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\create-user\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:N,staticGenerationAsyncStorage:c,serverHooks:p}=u,d="/api/siri/create-user/route";function A(){return(0,i.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:c})}},3810:(e,r,t)=>{t.d(r,{N:()=>E});let s=require("sqlite3");var a=t.n(s),T=t(6360);let i=null;async function E(){return i||(i=await (0,T.bA)({filename:"./bookings.db",driver:a().Database}),await i.exec(`
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
    `),await i.exec(`
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
    `),await i.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await i.get("SELECT COUNT(*) as count FROM services")).count&&await i.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),i}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[948,972,360],()=>t(5008));module.exports=s})();