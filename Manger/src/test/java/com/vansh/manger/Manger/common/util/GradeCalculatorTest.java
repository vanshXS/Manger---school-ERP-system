package com.vansh.manger.Manger.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GradeCalculatorTest {

    @Test
    void testComputeGrade_APlus() {
        assertEquals("A+", GradeCalculator.computeGrade(100.0));
        assertEquals("A+", GradeCalculator.computeGrade(90.0));
    }

    @Test
    void testComputeGrade_A() {
        assertEquals("A", GradeCalculator.computeGrade(89.9));
        assertEquals("A", GradeCalculator.computeGrade(80.0));
    }

    @Test
    void testComputeGrade_B() {
        assertEquals("B", GradeCalculator.computeGrade(79.9));
        assertEquals("B", GradeCalculator.computeGrade(70.0));
    }

    @Test
    void testComputeGrade_C() {
        assertEquals("C", GradeCalculator.computeGrade(69.9));
        assertEquals("C", GradeCalculator.computeGrade(60.0));
    }

    @Test
    void testComputeGrade_D() {
        assertEquals("D", GradeCalculator.computeGrade(59.9));
        assertEquals("D", GradeCalculator.computeGrade(40.0));
    }

    @Test
    void testComputeGrade_F() {
        assertEquals("F", GradeCalculator.computeGrade(39.9));
        assertEquals("F", GradeCalculator.computeGrade(0.0));
    }
}
