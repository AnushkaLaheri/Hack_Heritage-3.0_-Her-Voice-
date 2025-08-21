from flask import Blueprint, request, jsonify
from app import db
from models.equality_models import GenderPayGap, LeadershipStats, FieldRatio, Feedback, Company
from datetime import datetime

equality_bp = Blueprint('equality', __name__, url_prefix='/api/equality')

# Gender Pay Gap Routes
@equality_bp.route('/paygap', methods=['GET'])
def get_pay_gap():
    sector = request.args.get('sector')
    year = request.args.get('year', type=int)
    
    query = GenderPayGap.query
    
    if sector:
        query = query.filter_by(sector=sector)
    if year:
        query = query.filter_by(year=year)
    
    pay_gaps = query.all()
    return jsonify({
        'pay_gaps': [{
            'id': gap.id,
            'sector': gap.sector,
            'year': gap.year,
            'pay_gap_percentage': gap.pay_gap_percentage
        } for gap in pay_gaps]
    })

@equality_bp.route('/paygap', methods=['POST'])
def add_pay_gap():
    data = request.get_json()
    pay_gap = GenderPayGap(
        sector=data['sector'],
        year=data['year'],
        pay_gap_percentage=data['pay_gap_percentage']
    )
    db.session.add(pay_gap)
    db.session.commit()
    return jsonify({'message': 'Pay gap data added successfully'}), 201

# Leadership Stats Routes
@equality_bp.route('/leadership', methods=['GET'])
def get_leadership_stats():
    sector = request.args.get('sector')
    year = request.args.get('year', type=int)
    
    query = LeadershipStats.query
    
    if sector:
        query = query.filter_by(sector=sector)
    if year:
        query = query.filter_by(year=year)
    
    stats = query.all()
    return jsonify({
        'stats': [{
            'id': stat.id,
            'sector': stat.sector,
            'year': stat.year,
            'women_in_leadership': stat.women_in_leadership,
            'total_positions': stat.total_positions
        } for stat in stats]
    })

@equality_bp.route('/leadership', methods=['POST'])
def add_leadership_stats():
    data = request.get_json()
    stat = LeadershipStats(
        sector=data['sector'],
        year=data['year'],
        women_in_leadership=data['women_in_leadership'],
        total_positions=data['total_positions']
    )
    db.session.add(stat)
    db.session.commit()
    return jsonify({'message': 'Leadership stats added successfully'}), 201

# Field Ratio Routes
@equality_bp.route('/fields', methods=['GET'])
def get_field_ratios():
    field_name = request.args.get('field_name')
    year = request.args.get('year', type=int)
    
    query = FieldRatio.query
    
    if field_name:
        query = query.filter_by(field_name=field_name)
    if year:
        query = query.filter_by(year=year)
    
    ratios = query.all()
    return jsonify({
        'ratios': [{
            'id': ratio.id,
            'field_name': ratio.field_name,
            'women_count': ratio.women_count,
            'men_count': ratio.men_count,
            'year': ratio.year
        } for ratio in ratios]
    })

@equality_bp.route('/fields', methods=['POST'])
def add_field_ratio():
    data = request.get_json()
    ratio = FieldRatio(
        field_name=data['field_name'],
        women_count=data['women_count'],
        men_count=data['men_count'],
        year=data['year']
    )
    db.session.add(ratio)
    db.session.commit()
    return jsonify({'message': 'Field ratio added successfully'}), 201

# Feedback Routes
@equality_bp.route('/feedback', methods=['GET'])
def get_feedback():
    feedback_type = request.args.get('type')
    
    query = Feedback.query
    
    if feedback_type:
        query = query.filter_by(feedback_type=feedback_type)
    
    feedbacks = query.all()
    return jsonify({
        'feedback': [{
            'id': fb.id,
            'name': fb.name,
            'email': fb.email,
            'feedback_type': fb.feedback_type,
            'message': fb.message,
            'created_at': fb.created_at.isoformat()
        } for fb in feedbacks]
    })

@equality_bp.route('/feedback', methods=['POST'])
def add_feedback():
    data = request.get_json()
    feedback = Feedback(
        name=data['name'],
        email=data['email'],
        feedback_type=data['feedback_type'],
        message=data['message']
    )
    db.session.add(feedback)
    db.session.commit()
    return jsonify({'message': 'Feedback submitted successfully'}), 201

# Company Routes
@equality_bp.route('/companies', methods=['GET'])
def get_companies():
    companies = Company.query.all()
    return jsonify({
        'companies': [{
            'id': company.id,
            'name': company.name,
            'industry': company.industry,
            'employee_count': company.employee_count,
            'gender_equality_score': company.gender_equality_score
        } for company in companies]
    })

@equality_bp.route('/companies', methods=['POST'])
def add_company():
    data = request.get_json()
    company = Company(
        name=data['name'],
        industry=data['industry'],
        employee_count=data.get('employee_count'),
        gender_equality_score=data.get('gender_equality_score', 0.0)
    )
    db.session.add(company)
    db.session.commit()
    return jsonify({'message': 'Company added successfully'}), 201
