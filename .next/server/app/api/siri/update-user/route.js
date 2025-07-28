"use strict";(()=>{var e={};e.id=933,e.ids=[933],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},2424:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>c,patchFetch:()=>A,requestAsyncStorage:()=>p,routeModule:()=>o,serverHooks:()=>N,staticGenerationAsyncStorage:()=>d});var s={};t.r(s),t.d(s,{POST:()=>u});var a=t(9303),T=t(8716),i=t(670),E=t(7070),n=t(3810);async function u(e){try{let r;let{userId:t,patientName:s,phone:a,email:T}=await e.json();if(!t&&!s)return E.NextResponse.json({error:"Липсва ID или име на потребителя"},{status:400});let i=await (0,n.N)();if(!(r=t?await i.get("SELECT * FROM users WHERE id = ?",[t]):await i.get("SELECT * FROM users WHERE name = ?",[s])))return E.NextResponse.json({error:"Потребителят не е намерен"},{status:404});let u=[],o=[];if(s&&s!==r.name&&(u.push("name = ?"),o.push(s)),a&&a!==r.phone&&(u.push("phone = ?"),o.push(a)),T&&T!==r.email&&(u.push("email = ?"),o.push(T)),0===u.length)return E.NextResponse.json({error:"Няма промени за прилагане"},{status:400});return o.push(r.id),await i.run(`UPDATE users SET ${u.join(", ")} WHERE id = ?`,o),E.NextResponse.json({success:!0,message:`Потребителят ${r.name} е обновен успешно`})}catch(e){return console.error("Siri update user error:",e),E.NextResponse.json({error:"Възникна грешка при обновяване на потребителя"},{status:500})}}let o=new a.AppRouteRouteModule({definition:{kind:T.x.APP_ROUTE,page:"/api/siri/update-user/route",pathname:"/api/siri/update-user",filename:"route",bundlePath:"app/api/siri/update-user/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\update-user\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:d,serverHooks:N}=o,c="/api/siri/update-user/route";function A(){return(0,i.patchFetch)({serverHooks:N,staticGenerationAsyncStorage:d})}},3810:(e,r,t)=>{t.d(r,{N:()=>E});let s=require("sqlite3");var a=t.n(s),T=t(6360);let i=null;async function E(){return i||(i=await (0,T.bA)({filename:"./bookings.db",driver:a().Database}),await i.exec(`
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
      `)),i}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[948,972,360],()=>t(2424));module.exports=s})();