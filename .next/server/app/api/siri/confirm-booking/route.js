"use strict";(()=>{var e={};e.id=771,e.ids=[771],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},7378:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>p,patchFetch:()=>A,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>d,staticGenerationAsyncStorage:()=>N});var i={};t.r(i),t.d(i,{POST:()=>E});var T=t(9303),s=t(8716),o=t(670),a=t(7070),n=t(3810);async function E(e){try{let{bookingId:r}=await e.json();if(!r)return a.NextResponse.json({error:"ID на резервацията е задължително"},{status:400});let t=await (0,n.N)(),i=await t.get("SELECT * FROM bookings WHERE id = ?",[r]);if(!i)return a.NextResponse.json({error:"Резервацията не е намерена"},{status:404});return await t.run("UPDATE bookings SET status = ? WHERE id = ?",["confirmed",r]),a.NextResponse.json({success:!0,message:`Резервацията за ${i.name} на ${i.date} в ${i.time} е потвърдена успешно`})}catch(e){return console.error("Siri confirm booking error:",e),a.NextResponse.json({error:"Възникна грешка при потвърждаване на резервацията"},{status:500})}}let u=new T.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/siri/confirm-booking/route",pathname:"/api/siri/confirm-booking",filename:"route",bundlePath:"app/api/siri/confirm-booking/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\confirm-booking\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:c,staticGenerationAsyncStorage:N,serverHooks:d}=u,p="/api/siri/confirm-booking/route";function A(){return(0,o.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:N})}},3810:(e,r,t)=>{t.d(r,{N:()=>a});let i=require("sqlite3");var T=t.n(i),s=t(6360);let o=null;async function a(){return o||(o=await (0,s.bA)({filename:"./bookings.db",driver:T().Database}),await o.exec(`
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
      `)),o}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),i=r.X(0,[948,972,360],()=>t(7378));module.exports=i})();