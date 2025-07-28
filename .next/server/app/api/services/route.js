"use strict";(()=>{var e={};e.id=84,e.ids=[84],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},0:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>d,patchFetch:()=>A,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>p,staticGenerationAsyncStorage:()=>N});var T={};t.r(T),t.d(T,{GET:()=>o});var a=t(9303),s=t(8716),E=t(670),i=t(7070),n=t(3810);async function o(){try{let e=await (0,n.N)(),r=await e.all("SELECT * FROM services WHERE isActive = 1 ORDER BY name");return i.NextResponse.json({services:r})}catch(e){return i.NextResponse.json({error:"Internal server error"},{status:500})}}let c=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/services/route",pathname:"/api/services",filename:"route",bundlePath:"app/api/services/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\services\\route.ts",nextConfigOutput:"",userland:T}),{requestAsyncStorage:u,staticGenerationAsyncStorage:N,serverHooks:p}=c,d="/api/services/route";function A(){return(0,E.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:N})}},3810:(e,r,t)=>{t.d(r,{N:()=>i});let T=require("sqlite3");var a=t.n(T),s=t(6360);let E=null;async function i(){return E||(E=await (0,s.bA)({filename:"./bookings.db",driver:a().Database}),await E.exec(`
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
      `)),E}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),T=r.X(0,[948,972,360],()=>t(0));module.exports=T})();