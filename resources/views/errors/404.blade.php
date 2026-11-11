@extends('errors.layout')

@section('title', '404 - Page Not Found')
@section('code', '404')
@section('badge', 'Page Not Found')

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
</svg>
@endsection

@section('heading', 'Lost in Digital Space')

@section('message')
The page or resource you are looking for doesn't exist, has been relocated, or is temporarily unavailable. Double-check the URL or return to safety.
@endsection

