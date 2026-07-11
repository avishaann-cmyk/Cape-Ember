from pathlib import Path
import ast

import pytest
from enum import Enum
from typing import Optional


BACKEND_DIR = Path(__file__).resolve().parents[1]
SERVER_PATH = BACKEND_DIR / "server.py"


def load_shipping_helpers():
    source = SERVER_PATH.read_text()
    tree = ast.parse(source, filename=str(SERVER_PATH))
    wanted_names = {
        "VAT_RATE",
        "SHIPPING_ZONES",
        "ShippingMethod",
        "is_sedgefield_destination",
        "calculate_shipping",
        "calculate_vat",
        "calculate_cart_totals",
    }

    selected_nodes = []
    for node in tree.body:
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = []
            if isinstance(node, ast.Assign):
                targets = [target.id for target in node.targets if isinstance(target, ast.Name)]
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                targets = [node.target.id]
            if any(name in wanted_names for name in targets):
                selected_nodes.append(node)
        elif isinstance(node, ast.ClassDef) and node.name in wanted_names:
            selected_nodes.append(node)
        elif isinstance(node, ast.FunctionDef) and node.name in wanted_names:
            selected_nodes.append(node)

    namespace = {
        "Enum": Enum,
        "Optional": Optional,
        "re": __import__("re"),
    }
    exec(compile(ast.Module(body=selected_nodes, type_ignores=[]), str(SERVER_PATH), "exec"), namespace)
    return namespace


HELPERS = load_shipping_helpers()
SHIPPING_ZONES = HELPERS["SHIPPING_ZONES"]
ShippingMethod = HELPERS["ShippingMethod"]
calculate_cart_totals = HELPERS["calculate_cart_totals"]
calculate_shipping = HELPERS["calculate_shipping"]
is_sedgefield_destination = HELPERS["is_sedgefield_destination"]


def test_sedgefield_detection_accepts_common_variations():
    assert is_sedgefield_destination("Sedgefield")
    assert is_sedgefield_destination("Sedgefield, Western Cape")
    assert is_sedgefield_destination("  sedgefield  west ern cape ")


def test_sedgefield_shipping_is_free_for_standard_delivery():
    assert calculate_shipping(200, ShippingMethod.STANDARD, "Western Cape", False, "Sedgefield") == 0.0


def test_other_towns_use_configured_shipping_rates():
    expected = float(SHIPPING_ZONES["Western Cape"]["standard"])
    assert calculate_shipping(200, ShippingMethod.STANDARD, "Western Cape", False, "Knysna") == expected


def test_vat_is_reporting_only_and_not_added_to_total_twice():
    totals = calculate_cart_totals([
        {"price": 115.0, "quantity": 1},
    ], shipping_cost=75.0)

    assert totals["subtotal"] == 115.0
    assert totals["vat"] == pytest.approx(15.0, abs=0.01)
    assert totals["total"] == pytest.approx(190.0, abs=0.01)


def test_payment_amount_matches_checkout_total_when_shipping_is_free():
    totals = calculate_cart_totals([
        {"price": 230.0, "quantity": 1},
    ], shipping_cost=calculate_shipping(230.0, ShippingMethod.STANDARD, "Western Cape", False, "Sedgefield"))

    assert totals["shipping"] == 0.0
    assert totals["total"] == pytest.approx(230.0, abs=0.01)
