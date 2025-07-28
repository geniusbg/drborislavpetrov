"use strict";(()=>{var e={};e.id=415,e.ids=[415],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},3882:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>p,patchFetch:()=>A,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>d,staticGenerationAsyncStorage:()=>N});var i={};r.r(i),r.d(i,{POST:()=>o});var a=r(9303),T=r(8716),s=r(670),n=r(7070),E=r(3810);async function o(e){try{let{bookingId:t}=await e.json();if(!t)return n.NextResponse.json({error:"ID на резервацията е задължително"},{status:400});let r=await (0,E.N)(),i=await r.get("SELECT * FROM bookings WHERE id = ?",[t]);if(!i)return n.NextResponse.json({error:"Резервацията не е намерена"},{status:404});return await r.run("UPDATE bookings SET status = ? WHERE id = ?",["cancelled",t]),n.NextResponse.json({success:!0,message:`Резервацията за ${i.name} на ${i.date} в ${i.time} е отменена успешно`})}catch(e){return console.error("Siri cancel booking error:",e),n.NextResponse.json({error:"Възникна грешка при отменяване на резервацията"},{status:500})}}let c=new a.AppRouteRouteModule({definition:{kind:T.x.APP_ROUTE,page:"/api/siri/cancel-booking/route",pathname:"/api/siri/cancel-booking",filename:"route",bundlePath:"app/api/siri/cancel-booking/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\cancel-booking\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:u,staticGenerationAsyncStorage:N,serverHooks:d}=c,p="/api/siri/cancel-booking/route";function A(){return(0,s.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:N})}},3810:(e,t,r)=>{r.d(t,{N:()=>n});let i=require("sqlite3");var a=r.n(i),T=r(6360);let s=null;async function n(){return s||(s=await (0,T.bA)({filename:"./bookings.db",driver:a().Database}),await s.exec(`
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
    `),await s.exec(`
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
    `),await s.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await s.get("SELECT COUNT(*) as count FROM services")).count&&await s.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),s}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[948,972,360],()=>r(3882));module.exports=i})();