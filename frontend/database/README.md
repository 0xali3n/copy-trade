# Database Setup for Kana Copy Trader

This directory contains SQL scripts to set up the database tables for the Kana Copy Trader application.

## Setup Instructions

1. **Run the posts table creation script:**

   ```sql
   -- Execute the contents of posts_table.sql in your Supabase SQL editor
   ```

2. **The script creates the following tables:**

   - `posts` - Main table for storing social media trading posts
   - `post_likes` - Table for tracking post likes
   - `post_comments` - Table for storing post comments

3. **Features included:**
   - Row Level Security (RLS) policies
   - Automatic timestamp updates
   - Engagement count triggers
   - Support for different post types (text, image, trade, poll)

## Post Types Supported

- **Text Posts**: Simple text content
- **Image Posts**: Text with an attached image
- **Trade Posts**: Trading information with entry/exit prices, leverage, etc.
- **Poll Posts**: Interactive polls with multiple options

## Security

All tables have Row Level Security enabled with appropriate policies:

- Users can read all posts (public feed)
- Users can only create/update/delete their own posts
- Users can like/unlike any post
- Users can comment on any post but only edit/delete their own comments

## Real-time Features

The database is set up to support real-time updates for:

- New posts
- Post likes/unlikes
- Post comments
- Engagement count updates
