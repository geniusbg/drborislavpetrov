"use strict";(()=>{var e={};e.id=926,e.ids=[926],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},7179:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>p,patchFetch:()=>A,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>N,staticGenerationAsyncStorage:()=>c});var T={};r.r(T),r.d(T,{GET:()=>o});var a=r(9303),s=r(8716),E=r(670),i=r(7070),n=r(3810);async function o(){try{let e=await (0,n.N)(),t=await e.all("SELECT * FROM services ORDER BY id");return i.NextResponse.json({count:t.length,services:t})}catch(e){return i.NextResponse.json({error:"Internal server error"},{status:500})}}let u=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/debug/services/route",pathname:"/api/debug/services",filename:"route",bundlePath:"app/api/debug/services/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\debug\\services\\route.ts",nextConfigOutput:"",userland:T}),{requestAsyncStorage:d,staticGenerationAsyncStorage:c,serverHooks:N}=u,p="/api/debug/services/route";function A(){return(0,E.patchFetch)({serverHooks:N,staticGenerationAsyncStorage:c})}},3810:(e,t,r)=>{r.d(t,{N:()=>i});let T=require("sqlite3");var a=r.n(T),s=r(6360);let E=null;async function i(){return E||(E=await (0,s.bA)({filename:"./bookings.db",driver:a().Database}),await E.exec(`
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
    `),await E.exec(`
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
    `),await E.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await E.get("SELECT COUNT(*) as count FROM services")).count&&await E.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),E}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),T=t.X(0,[948,972,360],()=>r(7179));module.exports=T})();