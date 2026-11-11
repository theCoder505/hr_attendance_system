@extends('errors.layout')

@section('title', '505 - HTTP Version Not Supported')
@section('code', '505')
@section('badge', 'Protocol Error')

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
    <line x1="6" x2="6.01" y1="6" y2="6"/>
    <line x1="6" x2="6.01" y1="18" y2="18"/>
</svg>
@endsection

@section('heading', 'HTTP Version Not Supported')

@section('message')
The server does not support the HTTP protocol version used in this request. Please make sure your web browser or client application is up-to-date and using standard HTTP/1.1 or HTTP/2.
@endsection

