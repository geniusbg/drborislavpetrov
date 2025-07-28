"use strict";(()=>{var e={};e.id=812,e.ids=[812],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},1128:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>c,patchFetch:()=>R,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>p,staticGenerationAsyncStorage:()=>N});var s={};r.r(s),r.d(s,{POST:()=>o});var a=r(9303),T=r(8716),i=r(670),E=r(7070),n=r(3810);async function o(e){try{let t;let{userId:r,patientName:s}=await e.json();if(!r&&!s)return E.NextResponse.json({error:"Липсва ID или име на потребителя"},{status:400});let a=await (0,n.N)();if(!(t=r?await a.get("SELECT * FROM users WHERE id = ?",[r]):await a.get("SELECT * FROM users WHERE name = ?",[s])))return E.NextResponse.json({error:"Потребителят не е намерен"},{status:404});if((await a.get('SELECT COUNT(*) as count FROM bookings WHERE phone = ? AND status != "cancelled"',[t.phone])).count>0)return E.NextResponse.json({error:`Потребителят ${t.name} има активни резервации и не може да бъде изтрит`},{status:409});return await a.run("DELETE FROM users WHERE id = ?",[t.id]),E.NextResponse.json({success:!0,message:`Потребителят ${t.name} е изтрит успешно`})}catch(e){return console.error("Siri delete user error:",e),E.NextResponse.json({error:"Възникна грешка при изтриване на потребителя"},{status:500})}}let u=new a.AppRouteRouteModule({definition:{kind:T.x.APP_ROUTE,page:"/api/siri/delete-user/route",pathname:"/api/siri/delete-user",filename:"route",bundlePath:"app/api/siri/delete-user/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\delete-user\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:N,serverHooks:p}=u,c="/api/siri/delete-user/route";function R(){return(0,i.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:N})}},3810:(e,t,r)=>{r.d(t,{N:()=>E});let s=require("sqlite3");var a=r.n(s),T=r(6360);let i=null;async function E(){return i||(i=await (0,T.bA)({filename:"./bookings.db",driver:a().Database}),await i.exec(`
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
      `)),i}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[948,972,360],()=>r(1128));module.exports=s})();