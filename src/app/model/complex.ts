
/**
 * represents an complex number with real and imaginary parts
 */
export default class Complex {
    /**
     * a complex instance representing the real number zero
     */
    static readonly ZERO : Complex = new Complex(0,0);

    // a complex instance representing the real number 1
    static readonly ONE : Complex = new Complex(1,0);

    // the real number portion of the complex number
    readonly realPart : number;

    // the imaginary portion of the complex number
    readonly imagPart : number;

    /**
     * creates a complex number
     * @param realPart      the real portion of the complex number
     * @param imagPart      the imaginary portion of the complex number
     */
    constructor(realPart : number, imagPart : number) {
        this.realPart = realPart;
        this.imagPart = imagPart;
    }

    // /**
    //  * the imaginary part of the complex number
    //  */
    // get ImaginaryPart() : number {
    //     return this.imagPart;
    // }

    // /**
    //  * the real part of the complex number
    //  */
    // get RealPart() : number {
    //     return this.realPart;
    // }

    /**
     * adds this complex number to another complex number returning the result
     * @param other     the other number to add to
     * @returns         the created complex number
     */
    add(other : Complex) {
        return new Complex(this.realPart + other.realPart, this.imagPart + other.imagPart);
    }

    /**
     * performs subtraction of complex numbers: this - other = result
     * @param other     the subtraction item
     * @returns         the created item
     */
    sub(other : Complex) {
        return new Complex(this.realPart - other.realPart, this.imagPart - other.imagPart);
    }

    //  taken in part from https://introcs.cs.princeton.edu/java/32class/Complex.java.html
    /**
     * multiplies two complex numbers
     * @param other     the complex multiplier
     * @returns         the result of multiplying this and other together
     */
    multComp(other : Complex) {
        const real = this.realPart * other.realPart - this.imagPart * other.imagPart;
        const imag = this.realPart * other.imagPart + this.imagPart * other.realPart;
        return new Complex(real, imag);
    }

    /**
     * multiplies complex number by a real number
     * @param other         the real number
     * @returns             the result of multiplying this and other together
     */
    multNum(other : number) {
        return new Complex(this.realPart * other, this.imagPart * other);
    }

    /**
     * @returns a new Complex object whose value is the complex exponential of this
     */
    exp() {
        return new Complex(Math.exp(this.realPart) * Math.cos(this.imagPart), Math.exp(this.realPart) * Math.sin(this.imagPart));
    }

    /**
     * @returns a new Complex object whose value is the conjugate of this
     */
    conjugate() {
        return new Complex(this.realPart, -this.imagPart);
    }

    /**
     * @returns a new Complex object whose value is the reciprocal of this
     */
    reciprocal() {
        const scale = this.realPart * this.realPart + this.imagPart * this.imagPart;
        return new Complex(this.realPart / scale, -this.imagPart / scale);
    }

    /**
     * @returns the real number representing the absolute value of this complex number
     */
    abs() {
        return Math.sqrt(Math.pow(this.realPart, 2) + Math.pow(this.imagPart, 2));
    }

    /**
     * divide this by other as a divisor (i.e. this / b)
     * @param b         the divisor
     * @returns         the result of the division
     */
    divComp(b : Complex) {
        return this.multComp(b.reciprocal());
    }

    /**
     * divide this by other as a divisor (i.e. this / b)
     * @param b         the divisor
     * @returns         the result of the division
     */
    divNum(b : number) {
        return this.multComp(new Complex(1./b, 0));
    }

    /**
     * @returns     a string representing the complex number
     */
    toString() {
        return "Complex[ " + this.realPart + " + " + this.imagPart + " i ]";
    }

    /**
     * evaluates e^(iMult * i)
     * Based on Euler's formula:
     * https://en.wikipedia.org/wiki/Euler%27s_formula
     *
     * @param iMult  iMultiplier to multiply times i
     * @return the complex number evaluation
     */
    static euler(iMult : number) {
        return new Complex(Math.cos(iMult), Math.sin(iMult));
    }
}
