"""
PDF Export functionality for content history
"""

from typing import List
from datetime import datetime
import os
import re
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

def _sanitize_content_for_pdf(content: str) -> str:
    """
    Sanitize content for PDF generation by removing HTML tags and problematic characters
    
    Args:
        content: Raw content string
        
    Returns:
        Sanitized content safe for PDF generation
    """
    if not content:
        return ""
    
    # Remove HTML tags
    content = re.sub(r'<[^>]+>', '', content)
    
    # Replace HTML entities
    html_entities = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&#8211;': '-',  # en dash
        '&#8212;': '--', # em dash
        '&#8216;': "'",  # left single quote
        '&#8217;': "'",  # right single quote
        '&#8220;': '"',  # left double quote
        '&#8221;': '"',  # right double quote
        '&#8226;': '•',  # bullet
        '&#8230;': '...' # ellipsis
    }
    
    for entity, replacement in html_entities.items():
        content = content.replace(entity, replacement)
    
    # Remove or replace problematic characters
    content = content.replace('\u2011', '-')  # non-breaking hyphen
    content = content.replace('\u2013', '-')  # en dash
    content = content.replace('\u2014', '--') # em dash
    content = content.replace('\u2018', "'")  # left single quote
    content = content.replace('\u2019', "'")  # right single quote
    content = content.replace('\u201c', '"')  # left double quote
    content = content.replace('\u201d', '"')  # right double quote
    content = content.replace('\u2022', '•')  # bullet point
    content = content.replace('\u2026', '...') # ellipsis
    
    # Remove excessive whitespace
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Escape remaining XML/HTML special characters for ReportLab
    content = content.replace('&', '&amp;')
    content = content.replace('<', '&lt;')
    content = content.replace('>', '&gt;')
    
    return content

def create_pdf_report(entries: List, filename: str = None, user_id: str = "default_user") -> str:
    """
    Create a PDF report of content history
    
    Args:
        entries: List of ContentHistoryEntry objects
        filename: Output filename (optional)
        user_id: User identifier for the report
        
    Returns:
        Path to created PDF file or error message
    """
    
    if not entries:
        return "No entries to export"
    
    # Generate filename if not provided
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"content_history_{user_id}_{timestamp}.pdf"
    
    # Ensure filename ends with .pdf
    if not filename.endswith('.pdf'):
        filename += '.pdf'
    
    try:
        # Create PDF document
        doc = SimpleDocTemplate(filename, pagesize=letter)
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#6b46c1')
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#4c1d95')
        )
        
        content_style = ParagraphStyle(
            'ContentStyle',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            leftIndent=20
        )
        
        # Title
        story.append(Paragraph("Content History Report", title_style))
        story.append(Spacer(1, 12))
        
        # Report metadata
        report_date = datetime.now().strftime("%B %d, %Y at %H:%M")
        story.append(Paragraph(f"Generated on: {report_date}", styles['Normal']))
        story.append(Paragraph(f"User ID: {user_id}", styles['Normal']))
        story.append(Paragraph(f"Total Entries: {len(entries)}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Summary statistics
        total_words = sum(entry.word_count for entry in entries)
        content_types = {}
        for entry in entries:
            ct = entry.content_type or entry.template_key
            content_types[ct] = content_types.get(ct, 0) + 1
        
        story.append(Paragraph("Summary Statistics", heading_style))
        
        # Create summary table
        summary_data = [
            ['Metric', 'Value'],
            ['Total Content Pieces', str(len(entries))],
            ['Total Words', f"{total_words:,}"],
            ['Total Characters', f"{sum(entry.char_count for entry in entries):,}"],
            ['Favorite Content', str(sum(1 for entry in entries if entry.favorite))],
            ['Content Types', str(len(content_types))]
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6b46c1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Content type breakdown
        if content_types:
            story.append(Paragraph("Content Types", heading_style))
            
            type_data = [['Content Type', 'Count', 'Percentage']]
            for ct, count in sorted(content_types.items(), key=lambda x: x[1], reverse=True):
                percentage = f"{(count / len(entries)) * 100:.1f}%"
                type_data.append([ct, str(count), percentage])
            
            type_table = Table(type_data, colWidths=[2.5*inch, 1*inch, 1*inch])
            type_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6b46c1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(type_table)
            story.append(Spacer(1, 20))
        
        # Individual content entries
        story.append(Paragraph("Content History", heading_style))
        
        for i, entry in enumerate(entries, 1):
            # Entry header
            timestamp = datetime.fromisoformat(entry.timestamp).strftime("%Y-%m-%d %H:%M:%S")
            fav_icon = "⭐" if entry.favorite else ""
            
            entry_title = f"{i}. {entry.content_type} {fav_icon}"
            story.append(Paragraph(entry_title, styles['Heading3']))
            
            # Entry metadata
            metadata = f"Created: {timestamp} | Words: {entry.word_count} | Characters: {entry.char_count}"
            if entry.model_used:
                metadata += f" | Model: {entry.model_used}"
            if entry.version > 1:
                metadata += f" | Version: {entry.version}"
            
            story.append(Paragraph(metadata, styles['Normal']))
            story.append(Spacer(1, 6))
            
            # Parameters
            if entry.parameters:
                params_text = "Parameters: "
                param_items = []
                for key, value in entry.parameters.items():
                    if value and str(value).strip():
                        # Sanitize parameter values for PDF
                        clean_value = _sanitize_content_for_pdf(str(value))
                        if len(clean_value) > 100:  # Limit parameter length
                            clean_value = clean_value[:100] + "..."
                        param_items.append(f"{key}: {clean_value}")
                params_text += " | ".join(param_items[:3])  # Limit to 3 parameters
                story.append(Paragraph(params_text, styles['Italic']))
                story.append(Spacer(1, 6))
            
            # Content preview (first 500 characters)
            content_preview = entry.content
            if len(content_preview) > 500:
                content_preview = content_preview[:500] + "..."
            
            # Clean content for PDF (remove HTML tags and problematic characters)
            content_preview = _sanitize_content_for_pdf(content_preview)
            
            story.append(Paragraph(f"Content: {content_preview}", content_style))
            
            # Validation messages
            if entry.validation_messages:
                validation_text = "Validation: " + " | ".join(entry.validation_messages[:3])
                story.append(Paragraph(validation_text, styles['Italic']))
            
            story.append(Spacer(1, 15))
            
            # Page break every 5 entries to avoid overcrowding
            if i % 5 == 0 and i < len(entries):
                story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        
        return filename
        
    except Exception as e:
        return f"Error creating PDF: {str(e)}"

def is_pdf_export_available() -> bool:
    """Check if PDF export is available"""
    return True

def get_pdf_requirements() -> str:
    """Get requirements for PDF export"""
    return "PDF export is available"